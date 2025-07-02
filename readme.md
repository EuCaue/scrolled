# 🧭 Scrolled

**Scrolled** is a lightweight Firefox extension that adds a subtle scroll indicator to show how much
of a page you've read. Perfect for readers, researchers, or anyone who wants better visual feedback
while browsing long content.

---

## ✨ Features

- 📊 Simple and elegant scroll progress bar
- 🧠 Automatically activates on any webpage
- 🎯 Lightweight and fast
- ⚙️ No setup required, just install and go

---

## 📦 Installation

1. Clone this repo:

```bash
git clone https://github.com/EuCaue/scrolled.git
```

2. Open Firefox and go to `about:debugging`
3. Click **"This Firefox"** → **"Load Temporary Add-on..."**
4. Select the `manifest.json` file in the project directory

---

## 🔒 Permissions

- `activeTab` — to access the currently open tab
- `tabs` — to communicate between popup and content scripts
- `storage` - to handling extension settings

---

## 🛠️ Tech Stack

- TypeScript
- WebExtension APIs
- TailwindCSS
- Rollup
- CSS for progress bar styling

---

## 🚀 Todo

- [ ] Customizable scroll bar colors
- [ ] Enable/disable per site
- [ ] Dark mode compatibility

---

## 📃 License

GPLV3 © [EuCaue](https://github.com/EuCaue)
