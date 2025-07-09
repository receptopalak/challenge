# Baykar Fleet Management & Simulation Platform

This project is a full-stack application designed for real-time fleet management and simulation. It includes a Django backend, a React-based web frontend, and a React Native mobile application, all containerized with Docker for a seamless development experience.

---

## Features

- **Real-time Map View:** Track vehicle locations in real-time on an interactive map.
- **Backend API:** A robust Django API to manage vehicles, pilots, and commands.
- **Web Interface:** A comprehensive dashboard for monitoring and administration.
- **Mobile App:** An application for pilots to view their assigned vehicles and commands.
- **Containerized Environment:** The entire stack (Backend, Frontend, Mobile Bundler, Database, Redis) is managed by Docker Compose.

---


## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Git:** For cloning the repository.
- **Docker & Docker Compose:** For running the containerized application stack. [Docker Desktop](https://www.docker.com/products/docker-desktop/) is the recommended way to install both.

---

## 🚀 Getting Started

Follow these steps to get your development environment up and running.

### 1. Clone the Repository

```bash
git clone https://github.com/receptopalak/baykar_challenge
cd baykar
```

### 2. Create the Environment File (`.env`)

This is the most crucial manual step. The mobile application needs to know your computer's local IP address to connect to the backend and the Metro Bundler.

**a. Find Your Local IP Address:**

- **On macOS / Linux:**
  ```bash
  ifconfig | grep "inet " | grep -v 127.0.0.1
  # Or use: ip a
  ```
- **On Windows:**
  ```bash
  ipconfig
  ```
  Look for the "IPv4 Address" under your active network connection (e.g., Wi-Fi or Ethernet).

**b. Create the `.env` file:**

In the root directory of the project (the same folder as `docker-compose.yml`), create a new file named `.env`.

**c. Add your IP to the file:**

Open the `.env` file and add the following line, replacing `192.168.X.X` with the IP address you found in the previous step.

```
HOST_IP=192.168.X.X
```

### 3. Build and Run the Containers

This single command will build all the necessary Docker images and start all services in the background.

```bash
docker-compose up --build -d
```
> The first time you run this, it may take several minutes to download the base images and build the application containers.

### 4. Prepare the Database

After the containers are running, you need to initialize the database.

**a. Run Database Migrations:**
This creates the necessary tables in the database.
```bash
docker-compose exec backend python manage.py migrate
```

**b. Seed the Database:**
This populates the database with initial data (like users, airports, and planes) so the simulation can run correctly.
```bash
docker-compose exec backend python manage.py seed_data
```

**c. Create an Administrator:**
This command will prompt you to create a superuser account, which you can use to log into the Django admin panel (`/admin`).
```bash
docker-compose exec backend python manage.py createsuperuser
```

**🎉 Congratulations! The setup is complete.**

---

## Accessing the Services

- **Frontend Web Application:**
  - URL: `http://localhost:5173`

- **Backend API (Swagger Docs):**
  - URL: `http://localhost:8000/swagger/`

- **Mobile Application (Expo Metro Bundler):**
  - To connect your phone, you need the QR code. You can get it in two ways:

  - **Option 1: Via Web Browser (Recommended)**
    1. Open the Metro Bundler interface in your browser:
       - URL: `http://localhost:8081`
    2. A QR code will be displayed on the page.

  - **Option 2: Via Terminal Logs**
    1. In a separate terminal window, run the following command to view the live logs for the mobile service:
       ```bash
       docker-compose logs -f mobile
       ```
    2. The QR code will be printed directly in your terminal. This is useful for quick access without opening a browser.

  - **Connecting with Expo Go:**
    1. Ensure your mobile phone is on the **same Wi-Fi network** as your computer.
    2. Open the **Expo Go** app on your phone.
    3. Scan the QR code from either your browser or terminal.

---

## Development Workflow

- **To stop all services:**
  ```bash
  docker-compose down
  ```
- **To view logs for a specific service (e.g., mobile):**
  ```bash
  docker-compose logs -f mobile
  ```

---

##  troubleshooting

- **Error: `address already in use` for ports 8000, 5173, or 8081.**
  - This means another process is using that port on your machine. Find the process using `lsof -i :<port_number>` (macOS/Linux) and stop it, or change the port mapping in the `docker-compose.yml` file. For example, change `"8081:8081"` to `"8082:8081"`.

- **Mobile app can't connect to the backend.**
  - **Check the `HOST_IP` in your `.env` file.** Is it correct?
  - **Check your Wi-Fi.** Is your phone on the same network as your computer?
  - **Check your firewall.** Your computer's firewall might be blocking incoming connections on ports `8000` or `8081`. Ensure you allow connections from your local network.

- **Simulation doesn't run or planes don't move.**
  - Make sure you ran the `seed_data` command after `migrate`. The simulation needs initial data in the database to function.
  ```bash
  docker-compose exec backend python manage.py seed_data
  ```



