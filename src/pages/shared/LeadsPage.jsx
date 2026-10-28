import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { openWhatsApp } from "../../utils/whatsapp";

const empty = { name: "", phone: "", shop: "", area: "", stopName: "", notes: "", salesman: "" };

function LeadsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [channels, setChannels] = useState({ whatsapp: false, clickToChat: true });
  const [composer, setComposer] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [meeting, setMeeting] = useState({ date: "", time: "10:00" });
  const [notice, setNotice] = useState("");

  const load = async () => {
    const leads = await api.get("/leads");
    setRows(leads.data);
    if (user.role !== "salesman") {
      const people = await api.get("/users/salesmen");
      setSalesmen(people.data);
    }
  };

  useEffect(() => {
    load().catch((err) => setError(getErrorMessage(err)));
    api.get("/messages/status").then((res) => setChannels(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active?._id) return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/ai/chat/${active._id}`);
        setMessages(res.data.messages || []);
      } catch {
        /* ignore poll errors */
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [active?._id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const created = await api.post("/leads", {
        ...form,
        salesman: user.role === "salesman" ? user.id : form.salesman
      });
      setForm(empty);
      await load();
      await openChat(created.data, true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const qualify = async (lead) => {
    setBusy(lead._id);
    setError("");
    try {
      await api.post("/ai/qualify-lead", { leadId: lead._id });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const openComposer = async (lead) => {
    setBusy(lead._id);
    setError("");
    try {
      const res = await api.post("/ai/follow-up", { leadId: lead._id });
      setComposer({
        leadId: lead._id,
        name: lead.name,
        phone: lead.phone,
        source: res.data.source,
        message: res.data.message
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const sendWhatsApp = async () => {
    if (!composer?.message?.trim()) return;
    setBusy("send");
    setError("");
    try {
      const opened = openWhatsApp(composer.phone, composer.message);
      const res = await api.post("/messages/whatsapp", {
        leadId: composer.leadId,
        message: composer.message
      });
      const sent = Boolean(res.data.result?.sent);
      setComposer({
        ...composer,
        note: sent
          ? res.data.note
          : opened
            ? "WhatsApp opened with this message. Send it from WhatsApp."
            : res.data.note,
        sent: sent || opened
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  const openChat = async (lead, autoStart) => {
    setActive(lead);
    setNotice("");
    setMeeting({
      date: lead.meetingDate || "",
      time: lead.meetingTime || "10:00"
    });
    try {
      if (autoStart) {
        await api.post("/ai/auto-chat", { leadId: lead._id });
      }
      const res = await api.get(`/ai/chat/${lead._id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!active || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { _id: `tmp-${Date.now()}`, role: "customer", text }]);
    try {
      const res = await api.post("/ai/chat", { leadId: active._id, message: text });
      setMessages((prev) => [...prev, res.data.message]);
      if (res.data.status) setActive({ ...active, status: res.data.status });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const sendLastAiOnWhatsApp = async () => {
    if (!active?.phone) return;
    const lastAi = [...messages].reverse().find((msg) => msg.role === "ai" || msg.role === "salesman");
    if (!lastAi?.text) return;
    openWhatsApp(active.phone, lastAi.text);
    try {
      await api.post("/messages/whatsapp", { leadId: active._id, message: lastAi.text });
      const res = await api.get(`/ai/chat/${active._id}`);
      setMessages(res.data.messages || []);
      setNotice("WhatsApp opened with the last AI message.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const bookMeeting = async (e) => {
    e.preventDefault();
    if (!active) return;
    setBusy("meet");
    setError("");
    try {
      const res = await api.post("/ai/book-meeting", {
        leadId: active._id,
        date: meeting.date,
        time: meeting.time
      });
      setNotice(`Visit booked ${res.data.lead.meetingDate} at ${res.data.lead.meetingTime}. It is on the salesman's agenda as a task.`);
      setActive(res.data.lead);
      const chat = await api.get(`/ai/chat/${active._id}`);
      setMessages(chat.data.messages || []);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy("");
    }
  };

  return (
    <div>
      <div className="panel">
        <h3>Add lead / customer</h3>
        {error && <p className="error-text">{error}</p>}
        <p className="muted">
          Saving a lead starts an AI chat. WhatsApp opens on the lead's number with the drafted message.
          {channels.whatsapp
            ? " Twilio auto-send is on, and inbound replies land in Chat."
            : " Twilio is optional — Send WhatsApp still opens WhatsApp Web / the app."}
        </p>
        <form onSubmit={submit}>
          <div className="form-grid">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="WhatsApp / phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input placeholder="Shop / stop" value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} />
            <input placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <input placeholder="Linked stop name" value={form.stopName} onChange={(e) => setForm({ ...form, stopName: e.target.value })} />
            {user.role !== "salesman" && (
              <select value={form.salesman} onChange={(e) => setForm({ ...form, salesman: e.target.value })} required>
                <option value="">Select salesman</option>
                {salesmen.map((person) => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-grid full">
            <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="primary-btn" type="submit">Save lead</button>
        </form>
      </div>

      {composer && (
        <div className="panel">
          <h3>WhatsApp to {composer.name}</h3>
          <p className="muted">{composer.phone || "No phone on file"} · draft source: {composer.source}</p>
          <div className="form-grid full">
            <textarea
              value={composer.message}
              onChange={(e) => setComposer({ ...composer, message: e.target.value, note: "" })}
            />
          </div>
          <div className="toolbar">
            <button className="primary-btn" type="button" disabled={busy === "send" || !composer.phone} onClick={sendWhatsApp}>
              {busy === "send" ? "Sending..." : "Send WhatsApp"}
            </button>
            <button className="ghost-btn" type="button" onClick={() => setComposer(null)}>Close</button>
          </div>
          {composer.note && <p className={composer.sent ? "muted" : "error-text"}>{composer.note}</p>}
        </div>
      )}

      {active && (
        <div className="panel">
          <h3>AI chat · {active.name}</h3>
          <p className="muted">
            Type as the customer, or send the last AI line on WhatsApp.
            {active.meetingDate && ` Booked: ${active.meetingDate} ${active.meetingTime}`}
          </p>
          {notice && <p className="muted">{notice}</p>}
          <div className="chat-log">
            {messages.length === 0 && <p className="muted">No messages yet.</p>}
            {messages.map((msg) => (
              <div key={msg._id} className={`chat-bubble ${msg.role === "customer" ? "customer" : msg.role === "salesman" ? "salesman" : "ai"}`}>
                <span>{msg.text}</span>
                {msg.channel === "whatsapp" && <small> WhatsApp</small>}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} className="toolbar">
            <input
              style={{ flex: 1, minWidth: 180 }}
              placeholder="Customer message"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button className="primary-btn" type="submit">Send</button>
            <button className="ghost-btn" type="button" disabled={!active.phone} onClick={sendLastAiOnWhatsApp}>
              Send on WhatsApp
            </button>
            <button className="ghost-btn" type="button" onClick={() => openChat(active, true)}>Auto first message</button>
            <button className="ghost-btn" type="button" onClick={() => setActive(null)}>Close</button>
          </form>

          <h3 style={{ marginTop: 20 }}>Book visit</h3>
          <form onSubmit={bookMeeting}>
            <div className="form-grid">
              <input type="date" value={meeting.date} onChange={(e) => setMeeting({ ...meeting, date: e.target.value })} required />
              <input type="time" value={meeting.time} onChange={(e) => setMeeting({ ...meeting, time: e.target.value })} required />
            </div>
            <button className="primary-btn" type="submit" disabled={busy === "meet"}>
              {busy === "meet" ? "Booking..." : "Save meeting as task"}
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <h3>Leads</h3>
        {rows.length === 0 && <p className="muted">No customers yet. Add a lead for a shop stop.</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Shop</th>
              <th>Phone</th>
              <th>Salesman</th>
              <th>Status</th>
              <th>Meeting</th>
              <th>AI score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>{row.name}</td>
                <td>{row.shop || row.stopName}</td>
                <td>{row.phone}</td>
                <td>{row.salesman?.name}</td>
                <td>
                  <select defaultValue={row.status} onChange={(e) => api.patch(`/leads/${row._id}`, { status: e.target.value }).then(load)}>
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </td>
                <td>{row.meetingDate ? `${row.meetingDate} ${row.meetingTime}` : "—"}</td>
                <td>
                  {row.score != null ? <strong>{row.score}/10</strong> : "—"}
                  {row.nextAction && <div className="muted">{row.nextAction}</div>}
                </td>
                <td className="inline-actions">
                  <button className="small-btn" type="button" onClick={() => openChat(row, false)}>Chat</button>
                  <button className="small-btn" type="button" disabled={busy === row._id} onClick={() => qualify(row)}>
                    {busy === row._id ? "..." : "AI score"}
                  </button>
                  <button className="small-btn" type="button" disabled={busy === row._id || !row.phone} onClick={() => openComposer(row)}>
                    WhatsApp
                  </button>
                  <button className="danger-btn" type="button" onClick={() => api.delete(`/leads/${row._id}`).then(load)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadsPage;
