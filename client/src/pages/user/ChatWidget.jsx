import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';

const widgetPositions = [
  { value: 'BOTTOM_RIGHT', label: 'Bottom right' },
  { value: 'BOTTOM_LEFT', label: 'Bottom left' },
  { value: 'TOP_RIGHT', label: 'Top right' },
  { value: 'TOP_LEFT', label: 'Top left' },
  { value: 'BOTTOM_CENTER', label: 'Bottom center' },
  { value: 'TOP_CENTER', label: 'Top center' },
  { value: 'ALL_CENTER', label: 'Center' },
];

function escapeAttribute(value) {
  return String(value || 'Chat widget').replace(/"/g, '&quot;');
}

function sanitizeFilename(name) {
  return String(name || '').replace(/[^a-zA-Z0-9.-]/g, '');
}

function widgetUrl(widget) {
  return `${window.location.origin}/api/user/widget?id=${encodeURIComponent(widget.unique_id)}`;
}

function widgetPositionStyle(place) {
  switch (place) {
    case 'BOTTOM_LEFT':
      return 'bottom:0;left:0;';
    case 'TOP_RIGHT':
      return 'top:0;right:0;';
    case 'TOP_LEFT':
      return 'top:0;left:0;';
    case 'BOTTOM_CENTER':
      return 'bottom:0;left:50%;transform:translateX(-50%);';
    case 'TOP_CENTER':
      return 'top:0;left:50%;transform:translateX(-50%);';
    case 'ALL_CENTER':
      return 'top:50%;left:50%;transform:translate(-50%,-50%);';
    case 'BOTTOM_RIGHT':
    default:
      return 'bottom:0;right:0;';
  }
}

function widgetEmbedCode(widget) {
  const size = Number(widget.size || 60);
  const frameSize = Math.max(size + 48, 112);
  return `<iframe src="${widgetUrl(widget)}" title="${escapeAttribute(widget.title)}" style="border:0;width:${frameSize}px;height:${frameSize}px;position:fixed;${widgetPositionStyle(widget.place)}z-index:9999;background:transparent;" loading="lazy"></iframe>`;
}

function widgetPreviewStyle(place) {
  const alignItems = place?.includes('TOP')
    ? 'start'
    : place?.includes('CENTER')
      ? 'center'
      : 'end';
  const justifyItems = place?.includes('LEFT')
    ? 'start'
    : place?.includes('CENTER')
      ? 'center'
      : 'end';

  return {
    alignItems,
    justifyItems,
  };
}

function UserChatWidgetPage() {
  const { tokens } = useAuth();
  const [widgets, setWidgets] = useState([]);
  const [status, setStatus] = useState('Loading widgets...');
  const [copied, setCopied] = useState('');
  const [form, setForm] = useState({
    title: '',
    whatsapp_number: '',
    place: 'BOTTOM_RIGHT',
    selectedIcon: 'whatsapp-widget.svg',
    logoType: 'ICON',
    size: 60,
  });

  const loadWidgets = useCallback(async () => {
    setStatus('Loading widgets...');
    try {
      const result = await apiRequest('/api/user/get_my_widget', { token: tokens.user });
      setWidgets(Array.isArray(result?.data) ? result.data : []);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to load widgets');
    }
  }, [tokens.user]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  async function createWidget(event) {
    event.preventDefault();
    setStatus('Creating widget...');
    try {
      const result = await apiRequest('/api/user/add_widget', {
        method: 'POST',
        token: tokens.user,
        body: form,
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create widget');
        return;
      }

      setForm({ ...form, title: '', whatsapp_number: '', place: 'BOTTOM_RIGHT' });
      setStatus('Widget created.');
      loadWidgets();
    } catch (error) {
      setStatus(error.message || 'Unable to create widget');
    }
  }

  async function deleteWidget(id) {
    setStatus('Deleting widget...');
    try {
      const result = await apiRequest('/api/user/del_widget', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      });

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete widget');
        return;
      }

      setStatus('Widget deleted.');
      loadWidgets();
    } catch (error) {
      setStatus(error.message || 'Unable to delete widget');
    }
  }

  async function copyText(label, value) {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }

      await navigator.clipboard.writeText(value);
      setCopied(label);
      setStatus(`${label} copied.`);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
      setStatus(`Copy ${label.toLowerCase()} manually.`);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">click-to-chat launcher</span>
          <h2>Click-to-Chat launcher workspace</h2>
          <p>
            Create WhatsApp click-to-chat launchers, test the endpoint, and copy the iframe embed
            code. This creates a floating image button on a website that redirects visitors to a
            wa.me WhatsApp link.
          </p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <form className="panel form-panel" onSubmit={createWidget}>
        <div className="panel-header">
          <h2>Create widget</h2>
        </div>
        <div className="form-grid">
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label>
            WhatsApp number
            <input
              value={form.whatsapp_number}
              onChange={(event) => setForm({ ...form, whatsapp_number: event.target.value })}
              placeholder="+12025550184"
            />
          </label>
          <label>
            Placement
            <select
              value={form.place}
              onChange={(event) => setForm({ ...form, place: event.target.value })}
            >
              {widgetPositions.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Logo file in /media
            <input
              value={form.selectedIcon}
              onChange={(event) => setForm({ ...form, selectedIcon: event.target.value })}
            />
          </label>
          <label>
            Size
            <input
              min="40"
              type="number"
              value={form.size}
              onChange={(event) => setForm({ ...form, size: event.target.value })}
            />
          </label>
        </div>
        <div className="widget-preview" style={widgetPreviewStyle(form.place)}>
          <img
            src={`/media/${sanitizeFilename(form.selectedIcon) || 'whatsapp-widget.svg'}`}
            alt=""
            style={{ width: `${Number(form.size || 60)}px` }}
          />
        </div>
        <button className="primary-button" type="submit">
          Create widget
        </button>
      </form>

      <div className="card-grid">
        {widgets.length ? (
          widgets.map((widget) => (
            <article className="feature-card widget-card" key={widget.id}>
              <h3>{widget.title}</h3>
              <p>WhatsApp: {widget.whatsapp_number}</p>
              <p>
                Placement:{' '}
                {widgetPositions.find((position) => position.value === widget.place)?.label ||
                  widget.place}
              </p>
              <p>Size: {widget.size}px</p>
              <div className="widget-preview" style={widgetPreviewStyle(widget.place)}>
                <img
                  src={`/media/${sanitizeFilename(widget.logo) || 'whatsapp-widget.svg'}`}
                  alt=""
                  style={{ width: `${Number(widget.size || 60)}px` }}
                />
              </div>
              <div>
                <span className="eyebrow">endpoint</span>
                <div className="copy-chip">{widgetUrl(widget)}</div>
              </div>
              <div>
                <span className="eyebrow">embed</span>
                <pre className="embed-code">{widgetEmbedCode(widget)}</pre>
              </div>
              <div className="action-row">
                <button
                  className="mini-button dark-text"
                  type="button"
                  onClick={() => copyText('Widget URL', widgetUrl(widget))}
                >
                  {copied === 'Widget URL' ? 'Copied URL' : 'Copy URL'}
                </button>
                <button
                  className="mini-button dark-text"
                  type="button"
                  onClick={() => copyText('Embed code', widgetEmbedCode(widget))}
                >
                  {copied === 'Embed code' ? 'Copied embed' : 'Copy embed'}
                </button>
                <a
                  className="mini-button dark-text"
                  href={widgetUrl(widget)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open test
                </a>
                <button
                  className="mini-button subtle-danger"
                  type="button"
                  onClick={() => deleteWidget(widget.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="panel">
            <p className="empty-state">No widgets created yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserChatWidgetPage;
