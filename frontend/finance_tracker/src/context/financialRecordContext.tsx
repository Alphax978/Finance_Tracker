import { createContext, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "../utils/toastStore";

interface financialRecord {
    id?: string;
    userId: string,
    date: Date;
    description: string;
    amount: number,
    category: string,
    paymentMethod: string
}


interface financialRecordContextType {
    record: financialRecord[]
    isLoading: boolean
    addRecord: (record: financialRecord) => void;
    updateRecord: (id: string, newRecord: financialRecord) => void;
    deleteRecord: (id: string) => void;

}


export const financialRecordContext = createContext<financialRecordContextType | undefined>(undefined)

export const FinancialRecordsProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [records, setRecords] = useState<financialRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useUser()

    // Pure data fetch — no setState here. Each effect below owns its own
    // setState call inline, since calling an outside function that sets
    // state from within an effect body can't be statically verified as
    // async-safe and trips the set-state-in-effect lint rule.
    const loadRecordsFromServer = async (userId: string): Promise<financialRecord[]> => {
        const response = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/financialrecord/getUserById/${userId}`
        )
        return response.data.records.map((record: financialRecord & { _id: string }) => ({
            ...record,
            id: record._id,
        }))
    }

    useEffect(() => {
        if (!user) return

        const load = async () => {
            try {
                setRecords(await loadRecordsFromServer(user.id))
            } catch {
                toast.error("Failed to fetch records")
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [user])

    // Records can also be added from outside the app entirely (the chat
    // automation bots write straight to the database) — refetch whenever
    // the tab regains focus so those show up without a manual reload.
    useEffect(() => {
        if (!user) return

        const handleFocus = () => {
            if (document.visibilityState !== 'visible') return

            const load = async () => {
                try {
                    setRecords(await loadRecordsFromServer(user.id))
                } catch {
                    toast.error("Failed to fetch records")
                }
            }
            load()
        }

        document.addEventListener('visibilitychange', handleFocus)
        window.addEventListener('focus', handleFocus)
        return () => {
            document.removeEventListener('visibilitychange', handleFocus)
            window.removeEventListener('focus', handleFocus)
        }
    }, [user])

    const addRecord = async(record: financialRecord) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/financialrecord/add`,
                record
            )
            const savedRecord = response.data.savedRecord
            setRecords((prev) => [...prev, { ...savedRecord, id: savedRecord._id }])
            console.log(records)
            toast.success("Record added successfully")
        } catch {
            toast.error("Failed to add record")
        }
    }

    const updateRecord = async(id: string, newRecord: financialRecord) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/financialrecord/edit/${id}`,
                newRecord
            )
            setRecords((prev) =>
                prev.map((record) => (record.id === id ? { ...newRecord, id } : record))
            )
            toast.success("Record updated successfully")
        } catch {
            toast.error("Failed to update record")
        }
    }

    const deleteRecord = async(id: string) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_BACKEND_URL}/api/financialrecord/delete/${id}`
            )
            setRecords((prev) => prev.filter((record) => record.id !== id))
            toast.success("Record deleted successfully")
        } catch {
            toast.error("Failed to delete record")
        }
    }

    return (
        <financialRecordContext.Provider value={{ record: records, isLoading, addRecord, updateRecord, deleteRecord }}>
            {" "}
            {children}
        </financialRecordContext.Provider>
    );
};


