const UserSchema = require("../models/user.models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const deleteFile = require("../utils/deleteFile");
const cloudinaryUpload = require("../config/cloudinary");

// Function for getting all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserSchema.find().select("-hashed_password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Function for getting a single user by id
exports.getUser = async (req, res) => {
  let user;
  try {
    user = await UserSchema.findById(req.userId).select("-hashed_password");
    if (!user) {
      return res.status(404).json({ message: "Cannot find user" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.status(200).json(user);
};

// Authenticate User
exports.authenticate = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Required field missing!" });
  }
  try {
    const existingUser = await UserSchema.findOne({
      email: email,
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      existingUser.hashed_password
    );

    if (!passwordMatched) {
      return res.status(401).json({ message: "Wrong Credentials!" });
    }

    // set expiresIn for 30 days if rememberMe is true else null
    let expiresInTime;
    if (rememberMe) {
      expiresInTime = "30d";
    } else {
      expiresInTime = "24h";
    }

    const token = jwt.sign(
      { userId: existingUser._id },
      process.env.JWT_ACCESS_TOKEN_SECRET,
      {
        expiresIn: expiresInTime,
      }
    );

    res.status(200).json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Function for creating a new user
exports.createUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    if (!email || !password || !firstName || !lastName || !req.file) {
      return res.status(400).json({ message: "Required field missing" });
    }
    const existingUser = await UserSchema.findOne({
      email: email,
    });

    // CHECK IF EMAIL IS ALREADY IN USE
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use!" });
    }

    // file upload on cloudinary

    const b64 = Buffer.from(req.file.buffer).toString("base64");

    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
    const { url } = await cloudinaryUpload(dataURI);

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserSchema.create({
      firstName,
      lastName,
      email,
      hashed_password: hashedPassword,
      image_url: url,
    });

    // EXCLUDE THE hashed_password FIELD FROM THE RESPONSE
    newUser.toJSON = function () {
      const obj = this.toObject();
      delete obj.hashed_password;
      return obj;
    };

    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Function for updating a user
exports.updateUser = async (req, res) => {
  console.log(req.body);
  let user;
  try {
    user = await UserSchema.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "Cannot find user" });
    }
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");

      let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const { url } = await cloudinaryUpload(dataURI);

      user.image_url = url;
    }

    if (req.body.password && req.body.newPassword) {
      const passwordMatched = await bcrypt.compare(
        req.body.password,
        user.hashed_password
      );

      if (!passwordMatched) {
        return res.status(401).json({ message: "Invalid Credentials" });
      }

      const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
      user.hashed_password = hashedPassword;
    }

    const updatedUser = await user.save();

    res
      .status(200)
      .json({ message: "Successfully updated.", user: updatedUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
    console.log(err);
  }
};

// Function for deleting a user
exports.deleteUser = async (req, res) => {
  let user;
  try {
    user = await UserSchema.findById(req.userId);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  try {
    await user.remove();
    res.json({ message: "User deleted!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
