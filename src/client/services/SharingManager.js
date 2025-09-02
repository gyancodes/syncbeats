// Room Sharing and Social Features Management
export class SharingManager {
  constructor(app) {
    this.app = app;
  }

  showSharingSection() {
    document.getElementById("sharingSection").style.display = "block";
    this.app.socketManager.emit("getShareLink", this.app.currentRoom);
  }

  updateShareLink(shareLink) {
    document.getElementById("shareLink").value = shareLink;
  }

  copyShareLink() {
    const shareLink = document.getElementById("shareLink");
    shareLink.select();
    document.execCommand("copy");
    alert("Link copied to clipboard!");
  }

  shareOnWhatsApp() {
    const shareLink = document.getElementById("shareLink").value;
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
  }

  shareOnTelegram() {
    const shareLink = document.getElementById("shareLink").value;
    const text = `Join me on SyncBeats! 🎵\n${shareLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, "_blank");
  }

  shareViaEmail() {
    const shareLink = document.getElementById("shareLink").value;
    const subject = "Join me on SyncBeats! 🎵";
    const body = `Hey! I'm listening to music on SyncBeats and would love for you to join!\n\nClick this link to join: ${shareLink}\n\nSee you there! 🎶`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  }
}