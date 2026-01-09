import "./UserList.css";

function UserList({ users, currentUserId }) {
  return (
    <div className="user-list">
      <h3 className="user-list-title">
        Listeners <span className="user-count">{users.length}</span>
      </h3>
      <div className="users-container">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`user-item ${user.id === currentUserId ? "is-you" : ""}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">
              {user.name}
              {user.id === currentUserId && (
                <span className="you-badge">You</span>
              )}
            </span>
            <div className="user-status">
              <span className="status-dot listening"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserList;
