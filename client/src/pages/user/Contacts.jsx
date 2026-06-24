import { useCallback, useEffect, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { DashboardCard } from '../../components/Dashboard'

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid var(--border-color)',
  boxShadow: '0 24px 70px rgba(0, 0, 0, 0.5)',
  width: 'min(500px, 90%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'grid',
  gap: '16px',
};

function UserContactsPage() {
  const { tokens } = useAuth()
  const [phonebooks, setPhonebooks] = useState([])
  const [contacts, setContacts] = useState([])
  const [status, setStatus] = useState('')
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [phonebookName, setPhonebookName] = useState('')
  const [csvFile, setCsvFile] = useState(null)
  
  // Custom edit states
  const [renamingPhonebook, setRenamingPhonebook] = useState(null)
  const [renamedPhonebookName, setRenamedPhonebookName] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [editedContactForm, setEditedContactForm] = useState({
    id: '',
    name: '',
    mobile: '',
    var1: '',
    var2: '',
    var3: '',
    var4: '',
    var5: '',
  })

  const [contactForm, setContactForm] = useState({
    phonebookId: '',
    name: '',
    mobile: '',
    var1: '',
    var2: '',
    var3: '',
    var4: '',
    var5: '',
  })

  const loadContactsData = useCallback(async () => {
    setTableLoading(true)
    try {
      const [phonebookResult, contactResult] = await Promise.all([
        apiRequest('/api/phonebook/get_by_uid', { token: tokens.user }),
        apiRequest('/api/phonebook/get_uid_contacts', { token: tokens.user }),
      ])

      setPhonebooks(Array.isArray(phonebookResult?.data) ? phonebookResult.data : [])
      setContacts(Array.isArray(contactResult?.data) ? contactResult.data : [])
    } catch (error) {
      setStatus(error.message || 'Unable to load contacts')
    } finally {
      setTableLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadContactsData()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadContactsData])

  const selectedPhonebook = phonebooks.find(
    (phonebook) => String(phonebook.id) === String(contactForm.phonebookId),
  )

  async function createPhonebook(event) {
    event.preventDefault()
    if (!phonebookName.trim()) {
      setStatus('Phonebook name is required.')
      return
    }

    setSaving(true)
    setStatus('Creating phonebook...')

    try {
      const result = await apiRequest('/api/phonebook/add', {
        method: 'POST',
        token: tokens.user,
        body: { name: phonebookName.trim() },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create phonebook')
        return
      }

      setPhonebookName('')
      setStatus('Phonebook created.')
      if (result?.data) {
        setPhonebooks((current) => [result.data, ...current])
      }
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to create phonebook')
    } finally {
      setSaving(false)
    }
  }

  async function deletePhonebook(id) {
    setSaving(true)
    setStatus('Deleting phonebook and its contacts...')

    try {
      const result = await apiRequest('/api/phonebook/del_phonebook', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete phonebook')
        return
      }

      setStatus('Phonebook deleted.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to delete phonebook')
    } finally {
      setSaving(false)
    }
  }

  async function createContact(event) {
    event.preventDefault()

    if (!selectedPhonebook) {
      setStatus('Select a phonebook before adding a contact.')
      return
    }
    if (!contactForm.mobile.trim()) {
      setStatus('Mobile number is required.')
      return
    }

    setSaving(true)
    setStatus('Creating contact...')

    try {
      const result = await apiRequest('/api/phonebook/add_single_contact', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: selectedPhonebook.id,
          phonebook_name: selectedPhonebook.name,
          mobile: contactForm.mobile.trim(),
          name: contactForm.name.trim(),
          var1: contactForm.var1.trim(),
          var2: contactForm.var2.trim(),
          var3: contactForm.var3.trim(),
          var4: contactForm.var4.trim(),
          var5: contactForm.var5.trim(),
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create contact')
        return
      }

      setContactForm({
        ...contactForm,
        name: '',
        mobile: '',
        var1: '',
        var2: '',
        var3: '',
        var4: '',
        var5: '',
      })
      setStatus('Contact created.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to create contact')
    } finally {
      setSaving(false)
    }
  }

  async function importContacts(event) {
    event.preventDefault()

    if (!selectedPhonebook || !csvFile) {
      setStatus('Select a phonebook and CSV file before importing.')
      return
    }

    const formData = new FormData()
    formData.append('id', selectedPhonebook.id)
    formData.append('phonebook_name', selectedPhonebook.name)
    formData.append('file', csvFile)

    setSaving(true)
    setStatus('Importing CSV contacts...')

    try {
      const result = await apiFormRequest('/api/phonebook/import_contacts', {
        token: tokens.user,
        formData,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to import contacts')
        return
      }

      setCsvFile(null)
      setStatus('Contacts imported.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to import contacts')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelectedContacts() {
    if (!selectedIds.length) {
      setStatus('Select at least one contact to delete.')
      return
    }

    setSaving(true)
    setStatus('Deleting selected contacts...')

    try {
      const result = await apiRequest('/api/phonebook/del_contacts', {
        method: 'POST',
        token: tokens.user,
        body: { selected: selectedIds },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete contacts')
        return
      }

      setSelectedIds([])
      setStatus('Contacts deleted.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to delete contacts')
    } finally {
      setSaving(false)
    }
  }

  function toggleContact(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  // custom actions
  function startRenamePhonebook(phonebook) {
    setRenamingPhonebook(phonebook)
    setRenamedPhonebookName(phonebook.name)
  }

  async function renamePhonebook(event) {
    event.preventDefault()
    if (!renamedPhonebookName.trim()) {
      setStatus('Phonebook name is required.')
      return
    }
    setSaving(true)
    setStatus('Renaming phonebook...')
    try {
      const result = await apiRequest('/api/phonebook/update', {
        method: 'POST',
        token: tokens.user,
        body: { id: renamingPhonebook.id, name: renamedPhonebookName.trim() },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to rename phonebook')
        return
      }

      setRenamingPhonebook(null)
      setRenamedPhonebookName('')
      setStatus('Phonebook renamed.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to rename phonebook')
    } finally {
      setSaving(false)
    }
  }

  function startEditContact(contact) {
    setEditingContact(contact)
    setEditedContactForm({
      id: contact.id,
      name: contact.name || '',
      mobile: contact.mobile || '',
      var1: contact.var1 || '',
      var2: contact.var2 || '',
      var3: contact.var3 || '',
      var4: contact.var4 || '',
      var5: contact.var5 || '',
    })
  }

  async function editContact(event) {
    event.preventDefault()
    if (!editedContactForm.mobile.trim()) {
      setStatus('Contact mobile number is required.')
      return
    }
    setSaving(true)
    setStatus('Updating contact...')
    try {
      const result = await apiRequest('/api/phonebook/update_contact', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: editedContactForm.id,
          name: editedContactForm.name.trim(),
          mobile: editedContactForm.mobile.trim(),
          var1: editedContactForm.var1.trim(),
          var2: editedContactForm.var2.trim(),
          var3: editedContactForm.var3.trim(),
          var4: editedContactForm.var4.trim(),
          var5: editedContactForm.var5.trim(),
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update contact')
        return
      }

      setEditingContact(null)
      setStatus('Contact updated.')
      loadContactsData()
      window.setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      setStatus(error.message || 'Unable to update contact')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">contacts</span>
          <h2>Phonebooks and contact records</h2>
          <p>Core CRM database for segmentation, inbox context, and broadcast targeting.</p>
        </div>
        <button className="primary-button" type="button" disabled={saving || tableLoading} onClick={loadContactsData}>
          {tableLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <DashboardCard title="Phonebooks" value={phonebooks.length} detail="Contact groups" />
        <DashboardCard title="Contacts" value={contacts.length} detail="Total records" />
        <DashboardCard title="Selected" value={selectedIds.length} detail="Bulk operation set" />
      </div>

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createPhonebook}>
          <div className="panel-header">
            <h2>Create phonebook</h2>
          </div>
          <label>
            Phonebook name
            <input
              disabled={saving}
              value={phonebookName}
              onChange={(event) => setPhonebookName(event.target.value)}
              placeholder="Enterprise leads"
            />
          </label>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add phonebook'}
          </button>
        </form>

        <form className="panel form-panel" onSubmit={importContacts}>
          <div className="panel-header">
            <h2>Import CSV</h2>
          </div>
          <label>
            Target phonebook
            <select
              disabled={saving}
              value={contactForm.phonebookId}
              onChange={(event) =>
                setContactForm({ ...contactForm, phonebookId: event.target.value })
              }
            >
              <option value="">Select phonebook</option>
              {phonebooks.map((phonebook) => (
                <option key={phonebook.id} value={phonebook.id}>
                  {phonebook.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            CSV file
            <input
              disabled={saving}
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
            />
          </label>
          <p className="muted-copy">CSV columns: name, mobile, var1, var2, var3, var4, var5.</p>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? 'Importing...' : 'Import contacts'}
          </button>
        </form>
      </div>

      <form className="panel form-panel" onSubmit={createContact}>
        <div className="panel-header">
          <h2>Add single contact</h2>
        </div>
        <div className="form-grid">
          <label>
            Phonebook
            <select
              disabled={saving}
              value={contactForm.phonebookId}
              onChange={(event) =>
                setContactForm({ ...contactForm, phonebookId: event.target.value })
              }
            >
              <option value="">Select phonebook</option>
              {phonebooks.map((phonebook) => (
                <option key={phonebook.id} value={phonebook.id}>
                  {phonebook.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Name
            <input
              disabled={saving}
              value={contactForm.name}
              onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
              placeholder="Aarav Mehta"
            />
          </label>
          <label>
            Mobile
            <input
              disabled={saving}
              value={contactForm.mobile}
              onChange={(event) => setContactForm({ ...contactForm, mobile: event.target.value })}
              placeholder="+919999999999"
            />
          </label>
          {['var1', 'var2', 'var3', 'var4', 'var5'].map((field) => (
            <label key={field}>
              {field}
              <input
                disabled={saving}
                value={contactForm[field]}
                onChange={(event) => setContactForm({ ...contactForm, [field]: event.target.value })}
                placeholder={`Optional ${field}`}
              />
            </label>
          ))}
        </div>
        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? 'Adding...' : 'Add contact'}
        </button>
      </form>

      {!phonebooks.length ? (
        <div className="empty-onboarding-card">
          <h3>No phonebooks or contacts available</h3>
          <p>To start organizing your audience for campaigns and inbox customer context:</p>
          <ol>
            <li>Use the <strong>Create phonebook</strong> form above to initialize a contact list.</li>
            <li>Select the phonebook in the <strong>Import CSV</strong> panel to bulk import contacts, or use the <strong>Add single contact</strong> form below.</li>
            <li>CSV uploads should use the header structure: <code>name, mobile, var1, var2, var3, var4, var5</code>.</li>
          </ol>
        </div>
      ) : (
        <div className="two-column-grid">
          <div className="panel table-panel">
            <div className="panel-header">
              <h2>Phonebooks</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {phonebooks.map((phonebook) => (
                  <tr key={phonebook.id}>
                    <td>{phonebook.name}</td>
                    <td>{phonebook.id}</td>
                    <td>
                      <div className="action-row">
                        <button
                          className="mini-button dark-text"
                          type="button"
                          onClick={() => startRenamePhonebook(phonebook)}
                        >
                          Rename
                        </button>
                        <button
                          className="mini-button subtle-danger"
                          type="button"
                          onClick={() => deletePhonebook(phonebook.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel table-panel">
            <div className="panel-header">
              <h2>Contacts</h2>
              <button className="mini-button subtle-danger" type="button" onClick={deleteSelectedContacts}>
                Delete selected
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Phonebook</th>
                  <th>Variables</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <input
                        checked={selectedIds.includes(contact.id)}
                        type="checkbox"
                        onChange={() => toggleContact(contact.id)}
                      />
                    </td>
                    <td>{contact.name || 'N/A'}</td>
                    <td>{contact.mobile}</td>
                    <td>{contact.phonebook_name || contact.phonebook_id}</td>
                    <td>
                      {[contact.var1, contact.var2, contact.var3, contact.var4, contact.var5]
                        .filter(Boolean)
                        .join(', ') || 'None'}
                    </td>
                    <td>
                      <button
                        className="mini-button dark-text"
                        type="button"
                        onClick={() => startEditContact(contact)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rename Phonebook Modal */}
      {renamingPhonebook && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div className="panel-header">
              <h2>Rename Phonebook</h2>
              <button className="mini-button" type="button" onClick={() => setRenamingPhonebook(null)}>Close</button>
            </div>
            <form onSubmit={renamePhonebook} className="form-panel">
              <label>
                New Name
                <input
                  disabled={saving}
                  value={renamedPhonebookName}
                  onChange={(event) => setRenamedPhonebookName(event.target.value)}
                  placeholder="E.g. VIP Leads"
                />
              </label>
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Rename'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div className="panel-header">
              <h2>Edit Contact Details</h2>
              <button className="mini-button" type="button" onClick={() => setEditingContact(null)}>Close</button>
            </div>
            <form onSubmit={editContact} className="form-panel">
              <label>
                Name
                <input
                  disabled={saving}
                  value={editedContactForm.name}
                  onChange={(event) => setEditedContactForm({ ...editedContactForm, name: event.target.value })}
                />
              </label>
              <label>
                Mobile
                <input
                  disabled={saving}
                  value={editedContactForm.mobile}
                  onChange={(event) => setEditedContactForm({ ...editedContactForm, mobile: event.target.value })}
                />
              </label>
              {['var1', 'var2', 'var3', 'var4', 'var5'].map((field) => (
                <label key={field}>
                  {field}
                  <input
                    disabled={saving}
                    value={editedContactForm[field]}
                    onChange={(event) => setEditedContactForm({ ...editedContactForm, [field]: event.target.value })}
                  />
                </label>
              ))}
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? 'Updating...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserContactsPage
