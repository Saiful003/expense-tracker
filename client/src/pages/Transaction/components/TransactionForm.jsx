import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CustomCategory from "./CustomCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "@/lib/axios";
import { useTransaction } from "@/provider/transactionProvider";
import useGetTotal from "@/hooks/useGetTotal";

const transactionFormSchema = z.object({
  transactionName: z.string().min(4, {
    message: "This field contain at least 1 character(6).",
  }),
  transactionType: z.string().min(1, {
    message: "Select a transaction type",
  }),
  transactionCategories: z.string().min(1, {
    message: "Select at least one category",
  }),
  transactionAmount: z
    .string()
    .min(1, { message: "At least put one figure of amount" }),
});

const TransactionForm = ({
  isEditMode,
  toggleTransactionForm,
  toggleEditForm,
  selectedTransaction,
}) => {
  const [categoryList, setCategoryList] = useState([]);
  const [openCustomCategory, setOpenCustomCategory] = useState(false);
  const [isOpenErrorPopUp, setIsOpenErrorPopUp] = useState(false);
  const { transactionList, setTransactionList, setTotalTransactions } =
    useTransaction();
  const { available } = useGetTotal();

  const form = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transactionName: "",
      transactionType: "",
      transactionCategories: "",
      transactionAmount: "",
    },
  });

  const transactionType = useWatch({
    control: form.control,
    name: "transactionType",
  });
  console.log(form.watch());

  useEffect(() => {
    if (isEditMode) {
      form.setValue("transactionName", selectedTransaction.name);
      form.setValue("transactionType", selectedTransaction.type);
      form.setValue("transactionCategories", selectedTransaction.category);
      form.setValue("transactionAmount", selectedTransaction.amount);
    } else {
      form.reset();
    }
  }, []);

  // Fetch all category by query
  const getCategoryListByType = async () => {
    const res = await axios.get(`/category/?type=${transactionType}`);
    setCategoryList(res?.data.categories);
  };

  // Fetch TypeData on every type change
  useEffect(() => {
    getCategoryListByType();
  }, [transactionType]);

  // Create New Transaction
  const createNewTransaction = async (values) => {
    // Checking things
    if (transactionType === "expense") {
      if (values.transactionAmount > available) {
        setIsOpenErrorPopUp(true);
        return;
      }
    }
    const res = await axios.post("/transaction", {
      name: values.transactionName,
      type: transactionType,
      category: values.transactionCategories,
      amount: values.transactionAmount,
    });

    // console.log("New TransactionList Created at Mongo", newData);
    setTransactionList([res.data.transaction, ...transactionList]);
    setTotalTransactions(res?.data?.totalTransactions);
    toggleTransactionForm();
  };

  // Edit Transaction
  const updateTransaction = async (values) => {
    try {
      const url = `/transaction/edit-transaction/${selectedTransaction?._id}`; // Assuming the correct API endpoint
      const { data, status } = await axios.put(url, {
        name: values.transactionName,
        type: transactionType,
        category: values.transactionCategories,
        amount: values.transactionAmount,
      });

      const newT = transactionList.map((t) => {
        if (t._id === selectedTransaction._id) {
          return { ...t, ...data.updatedTransaction };
        }
        return t;
      });

      setTransactionList(newT);
      toggleEditForm();
    } catch (error) {
      console.error(`Error updating transaction: ${error.message}`);
      // Handle the error, e.g., display an error message to the user
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mb-2 text-center">
          {isEditMode ? "Update Transaction" : "Create a new transaction"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* Transaction Name */}
          <form
            onSubmit={form.handleSubmit(
              isEditMode ? updateTransaction : createNewTransaction
            )}
          >
            <FormField
              control={form.control}
              name="transactionName"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Transaction Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter transaction name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                // console.log(field)
                <FormItem className="mb-4">
                  <FormLabel>Transaction Types</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('transactionCategories', '');
                      }}
                      value={field.value}
                      // defaultValue={field.value} // The default is creating issues, Its not updating at all
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Transaction Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Transaction Types</SelectLabel>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Transaction Category */}

            {transactionType && (
              <FormField
                control={form.control}
                name="transactionCategories"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Transaction Category</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              transactionType === "income"
                                ? "Select a Income Category"
                                : "Select a Expense Category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <div className="flex justify-between items-center">
                              {transactionType === "income" ? (
                                <SelectLabel>Income Categories</SelectLabel>
                              ) : (
                                <SelectLabel>Expense Categories</SelectLabel>
                              )}
                              {/* Add Income Custom Category */}
                              <CustomCategory
                                categoryList={categoryList}
                                setCategoryList={setCategoryList}
                                transactionType={transactionType}
                                open={openCustomCategory}
                                setOpen={setOpenCustomCategory}
                              />
                            </div>
                            {categoryList?.map((category) => {
                              if (category.type === transactionType) {
                                return (
                                  <SelectItem
                                    key={category._id}
                                    value={category._id} // 65fc86f410a53f8260825bfc
                                  >
                                    {category.name}
                                  </SelectItem>
                                );
                              }
                            })}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {/* Transaction Amount */}
            <FormField
              control={form.control}
              name="transactionAmount"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Transaction Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="mt-5 w-full" type="submit">
              {isEditMode ? "Update" : "Submit"}
            </Button>
          </form>
        </Form>

        {isOpenErrorPopUp && (
          <Dialog open={isOpenErrorPopUp}>
            <DialogContent className="bg-red-400">
              <div
                onClick={() => setIsOpenErrorPopUp(false)}
                className="cursor-pointer relative rounded-sm opacity-60 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none  focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="absolute right-[-15px] top-[-15px] h-5 w-5 rounded-md bg-rose-600 p-[2px] text-white " />
              </div>
              <p className="bg-red-800 p-2 rounded-lg text-center text-white">
                Unsufficient Fund!
              </p>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
