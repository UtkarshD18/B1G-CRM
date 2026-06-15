import { useCallback, useEffect, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { DashboardCard } from '../../components/Dashboard'

function UserContactsPage() {
  const { tokens } = useAuth()
  const [phonebooks, setPhonebooks] = useState([])
  const [contacts, setContacts] = useState([])
  const [status, setStatus] = useState('Loading contacts...')
  const [selectedIds, setSelectedIds] = useState([])
  const [phonebookName, setPhonebookName] = useState('')
  const [csvFile, setCsvFile] = useState(null)
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
    setStatus('Loading contacts...')
    try {
      const [phonebookResult, contactResult] = await Promise.all([
        apiRequest('/api/phonebook/get_by_uid', { token: tokens.user }),
        apiRequest('/api/phonebook/get_uid_contacts', { token: tokens.user }),
      ])

      setPhonebooks(Array.isArray(phonebookResult?.data) ? phonebookResult.data : [])
      setContacts(Array.isArray(contactResult?.data) ? contactResult.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load contacts')
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
    setStatus('Creating phonebook...')

    try {
      const result = await apiRequest('/api/phonebook/add', {
        method: 'POST',
        token: tokens.user,
        body: { name: phonebookName },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create phonebook')
        return
      }

      setPhonebookName('')
      setStatus('Phonebook created.')
      loadContactsData()
    } catch (error) {
      setStatus(error.message || 'Unable to create phonebook')
    }
  }

  async function deletePhonebook(id) {
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
    } catch (error) {
      setStatus(error.message || 'Unable to delete phonebook')
    }
  }

  async function createContact(event) {
    event.preventDefault()

    if (!selectedPhonebook) {
      setStatus('Select a phonebook before adding a contact.')
      return
    }

    setStatus('Creating contact...')

    try {
      const result = await apiRequest('/api/phonebook/add_single_contact', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: selectedPhonebook.id,
          phonebook_name: selectedPhonebook.name,
          mobile: contactForm.mobile,
          name: contactForm.name,
          var1: contactForm.var1,
          var2: contactForm.var2,
          var3: contactForm.var3,
          var4: contactForm.var4,
          var5: contactForm.var5,
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
    } catch (error) {
      setStatus(error.message || 'Unable to create contact')
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
    } catch (error) {
      setStatus(error.message || 'Unable to import contacts')
    }
  }

  async function deleteSelectedContacts() {
    if (!selectedIds.length) {
      setStatus('Select at least one contact to delete.')
      return
    }

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
    } catch (error) {
      setStatus(error.message || 'Unable to delete contacts')
    }
  }

  function toggleContact(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">contacts</span>
          <h2>Phonebooks and contact records</h2>
          <p>Core CRM database for segmentation, inbox context, and broadcast targeting.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadContactsData}>
          Refresh
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
              value={phonebookName}
              onChange={(event) => setPhonebookName(event.target.value)}
              placeholder="Enterprise leads"
            />
          </label>
          <button className="primary-button" type="submit">
            Add phonebook
          </button>
        </form>

        <form className="panel form-panel" onSubmit={importContacts}>
          <div className="panel-header">
            <h2>Import CSV</h2>
          </div>
          <label>
            Target phonebook
            <select
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
              accept=".csv,text/csv"
              type="file"
              onChange={(event) => setCsvFile(event.target.files?.[0] || null)}
            />
          </label>
          <p className="muted-copy">CSV columns: name, mobile, var1, var2, var3, var4, var5.</p>
          <button className="primary-button" type="submit">
            Import contacts
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
              value={contactForm.name}
              onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
              placeholder="Aarav Mehta"
            />
          </label>
          <label>
            Mobile
            <input
              value={contactForm.mobile}
              onChange={(event) => setContactForm({ ...contactForm, mobile: event.target.value })}
              placeholder="+919999999999"
            />
          </label>
          {['var1', 'var2', 'var3', 'var4', 'var5'].map((field) => (
            <label key={field}>
              {field}
              <input
                value={contactForm[field]}
                onChange={(event) => setContactForm({ ...contactForm, [field]: event.target.value })}
                placeholder={`Optional ${field}`}
              />
            </label>
          ))}
        </div>
        <button className="primary-button" type="submit">
          Add contact
        </button>
      </form>

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
                <th />
              </tr>
            </thead>
            <tbody>
              {phonebooks.map((phonebook) => (
                <tr key={phonebook.id}>
                  <td>{phonebook.name}</td>
                  <td>{phonebook.id}</td>
                  <td>
                    <button
                      className="mini-button subtle-danger"
                      type="button"
                      onClick={() => deletePhonebook(phonebook.id)}
                    >
                      Delete
                    </button>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserContactsPage
