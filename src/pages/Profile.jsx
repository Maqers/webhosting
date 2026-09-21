import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import SeoHead from '../components/SeoHead'
import './Profile.css'

const emptyAddress = { label: '', name: '', phone: '', address: '', city: '', state: '', pincode: '' }

function newId() {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

export default function Profile() {
  const { isLoggedIn, user, openLoginModal, updateProfile } = useAuth()
  const [name, setName] = useState('')
  const [addresses, setAddresses] = useState([])
  const [form, setForm] = useState(emptyAddress)
  const [editingId, setEditingId] = useState(null) // null = not editing, 'new' = adding, else address id
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const meta = user.user_metadata || {}
    setName(meta.full_name || meta.name || '')
    setAddresses(Array.isArray(meta.addresses) ? meta.addresses : [])
  }, [user])

  const persistAddresses = async (next) => {
    setSaving(true)
    setError('')
    try {
      await updateProfile({ addresses: next })
      setAddresses(next)
      setEditingId(null)
      setForm(emptyAddress)
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateProfile({ full_name: name })
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const startAdd = () => { setForm(emptyAddress); setEditingId('new') }
  const startEdit = (addr) => { setForm(addr); setEditingId(addr.id) }
  const cancelEdit = () => { setEditingId(null); setForm(emptyAddress) }

  const handleSaveAddress = (e) => {
    e.preventDefault()
    if (!form.address.trim() || !form.city.trim() || !form.pincode.trim()) {
      setError('Address, city, and pincode are required.')
      return
    }
    let next
    if (editingId === 'new') {
      next = [...addresses, { ...form, id: newId(), isDefault: addresses.length === 0 }]
    } else {
      next = addresses.map(a => a.id === editingId ? { ...form, id: editingId } : a)
    }
    persistAddresses(next)
  }

  const handleDelete = (id) => {
    const next = addresses.filter(a => a.id !== id)
    // If we deleted the default, promote the first remaining one
    if (next.length > 0 && !next.some(a => a.isDefault)) next[0] = { ...next[0], isDefault: true }
    persistAddresses(next)
  }

  const handleSetDefault = (id) => {
    persistAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })))
  }

  const joinedOn = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="profile-page">
      <SeoHead title="My Profile" noIndex={true} />
      <div className="profile-container">
        <h1 className="profile-title">My Profile</h1>

        {!isLoggedIn && (
          <div className="profile-empty">
            <p>Log in to view and edit your profile.</p>
            <button className="profile-login-btn" onClick={openLoginModal} type="button">Log In</button>
          </div>
        )}

        {isLoggedIn && (
          <>
            <form className="profile-form" onSubmit={handleSaveName}>
              <div className="profile-readonly">
                <div>
                  <span className="profile-readonly-label">Email / Phone</span>
                  <span className="profile-readonly-value">{user?.email || user?.phone}</span>
                </div>
                {joinedOn && (
                  <div>
                    <span className="profile-readonly-label">Joined on</span>
                    <span className="profile-readonly-value">{joinedOn}</span>
                  </div>
                )}
              </div>

              <label className="profile-label">Name</label>
              <input className="profile-input" value={name} onChange={e => { setName(e.target.value); setSaved(false) }} placeholder="Your name" />

              <button className="profile-save-btn" type="submit" disabled={saving}>
                {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Name'}
              </button>
            </form>

            <div className="profile-addresses">
              <div className="profile-addresses-header">
                <h2 className="profile-section-title">Saved Addresses</h2>
                {editingId === null && (
                  <button className="profile-add-address-btn" onClick={startAdd} type="button">+ Add Address</button>
                )}
              </div>

              {error && <p className="profile-error">{error}</p>}

              {addresses.length === 0 && editingId === null && (
                <p className="profile-no-addresses">No saved addresses yet — add one to speed up checkout.</p>
              )}

              <div className="profile-address-list">
                {addresses.filter(a => a.id !== editingId).map(addr => (
                  <div className="profile-address-card" key={addr.id}>
                    <div className="profile-address-card-top">
                      <span className="profile-address-label">{addr.label || 'Address'}</span>
                      {addr.isDefault && <span className="profile-address-default-badge">Default</span>}
                    </div>
                    <p className="profile-address-text">
                      {addr.name && <strong>{addr.name}</strong>}{addr.name && <br />}
                      {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                      {addr.phone && <><br />{addr.phone}</>}
                    </p>
                    <div className="profile-address-actions">
                      <button type="button" onClick={() => startEdit(addr)}>Edit</button>
                      {!addr.isDefault && <button type="button" onClick={() => handleSetDefault(addr.id)}>Set as default</button>}
                      <button type="button" className="profile-address-delete" onClick={() => handleDelete(addr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {editingId !== null && (
                <form className="profile-address-form" onSubmit={handleSaveAddress}>
                  <h3 className="profile-section-title">{editingId === 'new' ? 'Add a new address' : 'Edit address'}</h3>
                  <label className="profile-label">Label <span className="profile-label-hint">(optional, e.g. Home, Work)</span></label>
                  <input className="profile-input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Home" />

                  <div className="profile-row">
                    <div>
                      <label className="profile-label">Recipient Name</label>
                      <input className="profile-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Who should we deliver to?" />
                    </div>
                    <div>
                      <label className="profile-label">Phone</label>
                      <input className="profile-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" maxLength={10} />
                    </div>
                  </div>

                  <label className="profile-label">Address</label>
                  <input className="profile-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="House no., street, area" />

                  <div className="profile-row">
                    <div>
                      <label className="profile-label">City</label>
                      <input className="profile-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" />
                    </div>
                    <div>
                      <label className="profile-label">State</label>
                      <input className="profile-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" />
                    </div>
                    <div>
                      <label className="profile-label">Pincode</label>
                      <input className="profile-input" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="Pincode" maxLength={6} />
                    </div>
                  </div>

                  <div className="profile-address-form-actions">
                    <button className="profile-save-btn" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Address'}
                    </button>
                    <button className="profile-cancel-btn" type="button" onClick={cancelEdit}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
