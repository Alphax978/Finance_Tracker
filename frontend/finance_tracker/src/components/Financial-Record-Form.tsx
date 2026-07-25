import { useUser } from '@clerk/clerk-react'
import React, { useContext, useState } from 'react'
import { financialRecordContext } from '../context/financialRecordContext'
import Spinner from './Spinner'
const FinancialRecordForm = () => {

    const {user} = useUser()
    const context = useContext(financialRecordContext)
    if (!context) {
        throw new Error("FinancialRecordForm must be used within a FinancialRecordsProvider")
    }
    const { addRecord } = context
    const [description, setDescription] = useState<string>("")
    const [amount, setAmount] = useState<string>("")
    const [category, setCategory] = useState<string>("Food")
    const [paymentMethod, setPaymentMethod] = useState<string>("Cash")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const newRecord = {
            userId: user?.id ?? "",
            date: new Date(),
            description: description,
            amount: parseFloat(amount),
            category: category,
            paymentMethod: paymentMethod
        }

        setSubmitting(true)
        try {
            await addRecord(newRecord)

            setDescription("")
            setAmount("")
            setCategory("Food")
            setPaymentMethod("Cash")
        } finally {
            setSubmitting(false)
        }
    }

    
  return (
    <div className='form-container'>
      <form onSubmit={handleSubmit}>
        <span className="form-eyebrow">
          <svg className="eyebrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Add New Record
        </span>
        <div className="form-field form-field-full">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            placeholder="e.g. Groceries"
            value={description}
            required
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              required
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Food">Food</option>
              <option value="Rent">Rent</option>
              <option value="Utilities">Utilities</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="form-field form-field-full">
          <label htmlFor="paymentMethod">Payment Method</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? (<><Spinner inline size="sm" />Adding…</>) : 'Add Record'}
        </button>
        <p className="form-note">
          Your monthly total resets automatically at the end of each month.{" "}
          <span className="form-note-highlight-blue">Don't forget to track each and every expense.</span>
        </p>
      </form>
    </div>
  )
}

export default FinancialRecordForm
