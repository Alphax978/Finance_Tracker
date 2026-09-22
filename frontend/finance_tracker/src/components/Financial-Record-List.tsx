import { useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { financialRecordContext } from '../context/financialRecordContext'
import { currencyContext } from '../context/currencyContext'
import { categoryColor } from '../constants/categories'
import Spinner from './Spinner'
import { truncateText } from '../utils/truncateText'
import { formatRecordDate } from '../utils/formatRecordDate'



interface RecordRowProps {
  record: {
    id?: string
    userId: string
    date: Date
    description: string
    amount: number
    category: string
    paymentMethod: string
  }
  onUpdate: (id: string, newRecord: RecordRowProps['record']) => void
  onDelete: (id: string) => void
}

type Field = 'description' | 'amount' | 'category' | 'paymentMethod'

export const RecordRow = ({ record, onUpdate, onDelete }: RecordRowProps) => {
  const currency = useContext(currencyContext)
  if (!currency) {
    throw new Error('RecordRow must be used within a CurrencyProvider')
  }
  const { formatAmount } = currency
  const [editingField, setEditingField] = useState<Field | null>(null)
  const [description, setDescription] = useState(record.description)
  const [amount, setAmount] = useState(record.amount)
  const [category, setCategory] = useState(record.category)
  const [paymentMethod, setPaymentMethod] = useState(record.paymentMethod)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!confirmingDelete) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmingDelete(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [confirmingDelete])

  const commit = (changes: Partial<RecordRowProps['record']>) => {
    setEditingField(null)
    const key = Object.keys(changes)[0] as Field
    if (changes[key] === record[key]) return

    onUpdate(record.id!, {
      userId: record.userId,
      date: record.date,
      description,
      amount,
      category,
      paymentMethod,
      ...changes,
    })
  }

  return (
    <tr>
      <td onClick={() => setEditingField('description')} title={description}>
        {editingField === 'description' ? (
          <input
            type="text"
            value={description}
            autoFocus
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => commit({ description })}
          />
        ) : (
          truncateText(description,25)
        )}
      </td>
      <td className="record-cell-amount" onClick={() => setEditingField('amount')}>
        {editingField === 'amount' ? (
          <input
            type="number"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            onBlur={() => commit({ amount })}
          />
        ) : (
          formatAmount(amount)
        )}
      </td>
      <td onClick={() => setEditingField('category')}>
        {editingField === 'category' ? (
          <select
            value={category}
            autoFocus
            onChange={(e) => {
              setCategory(e.target.value)
              commit({ category: e.target.value })
            }}
            onBlur={() => setEditingField(null)}
          >
            <option value="Food">Food</option>
            <option value="Rent">Rent</option>
            <option value="Utilities">Utilities</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Other">Other</option>
          </select>
        ) : (
          <span className="category-tag">
            <span className="category-dot" style={{ backgroundColor: categoryColor(category) }} />
            {category}
          </span>
        )}
      </td>
      <td onClick={() => setEditingField('paymentMethod')}>
        {editingField === 'paymentMethod' ? (
          <select
            value={paymentMethod}
            autoFocus
            onChange={(e) => {
              setPaymentMethod(e.target.value)
              commit({ paymentMethod: e.target.value })
            }}
            onBlur={() => setEditingField(null)}
          >
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        ) : (
          paymentMethod
        )}
      </td>
      <td className="record-cell-date">{formatRecordDate(record.date)}</td>
      <td>
        <button type="button" className="delete-button" onClick={() => setConfirmingDelete(true)}>
          Delete
        </button>
        {confirmingDelete && createPortal(
          <div className="record-delete-backdrop" onClick={() => setConfirmingDelete(false)}>
            <div className="record-delete-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="record-delete-modal-close"
                aria-label="Close"
                onClick={() => setConfirmingDelete(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div className="record-delete-modal-icon-wrap">
                <svg className="record-delete-modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="record-delete-modal-title">Delete this record?</h3>
              <p className="record-delete-modal-text">
                Deleting this could disrupt your tracking. Want to edit the amount instead?
              </p>
              <div className="record-delete-modal-actions">
                <button
                  type="button"
                  className="record-delete-modal-edit"
                  onClick={() => {
                    setConfirmingDelete(false)
                    setEditingField('amount')
                  }}
                >
                  Edit Amount
                </button>
                <button
                  type="button"
                  className="record-delete-modal-delete"
                  onClick={() => {
                    setConfirmingDelete(false)
                    onDelete(record.id!)
                  }}
                >
                  Delete Anyway
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </td>
    </tr>
  )
}

const FinancialRecordList = () => {
  const context = useContext(financialRecordContext)
  if (!context) {
    throw new Error('FinancialRecordList must be used within a FinancialRecordsProvider')
  }
  const { record: records, isLoading, updateRecord, deleteRecord } = context
  const currency = useContext(currencyContext)
  if (!currency) {
    throw new Error('FinancialRecordList must be used within a CurrencyProvider')
  }
  const { formatAmount } = currency
  const now = new Date()
  const total = records
    .filter((record) => {
      const d = new Date(record.date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, record) => sum + record.amount, 0)

  return (
    <div className="record-list-container" id="record-list">
      <div className="record-list-header">
        <div className="record-list-heading-group">
          <h2>
            <svg className="record-list-heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="9" y1="12" x2="15" y2="12" />
            </svg>
            Record List
          </h2>
          <span className="record-list-hint">Click any field to edit it</span>
        </div>
        <div className="record-list-stat">
          <span className="record-list-stat-label">Total Monthly</span>
          <span className="record-list-stat-value">
            -{formatAmount(total)}
          </span>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading your records…" />
      ) : records.length === 0 ? (
        <div className="record-list-empty">
          <svg className="record-list-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="12" x2="15" y2="12" />
          </svg>
          <span>No records yet — add your first one above.</span>
        </div>
      ) : (
        <div className="record-list-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  onUpdate={updateRecord}
                  onDelete={deleteRecord}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default FinancialRecordList
