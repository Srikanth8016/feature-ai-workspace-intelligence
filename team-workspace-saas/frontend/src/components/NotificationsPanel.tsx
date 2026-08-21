"use client";

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

interface Props {
  notifications: Notification[];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotificationsPanel({ notifications, onMarkRead, onDelete, onMarkAllRead, onClose }: Props) {
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute right-0 top-0 h-full w-80 bg-zinc-950/98 border-l border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
          <div>
            <h2 className="font-bold text-white text-sm">Notifications</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{unread} unread</p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={onMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-10 h-10 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm text-zinc-500">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border text-sm flex items-start gap-3 transition-all ${
                  n.is_read
                    ? "bg-zinc-900/20 border-zinc-900 text-zinc-500"
                    : "bg-indigo-500/[0.04] border-indigo-500/15 text-zinc-200"
                }`}
              >
                {!n.is_read && (
                  <span className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                )}
                <p className={`flex-1 text-xs leading-relaxed ${n.is_read ? "pl-5" : ""}`}>{n.message}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="p-1 rounded text-zinc-600 hover:text-indigo-400 transition-colors"
                      title="Mark as read"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(n.id)}
                    className="p-1 rounded text-zinc-700 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
