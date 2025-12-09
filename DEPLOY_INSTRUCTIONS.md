# Deployment Instructions for Ubuntu Server

This guide describes how to deploy the Security Learning Platform to your Ubuntu VM using Docker.

## Prerequisites

On your Ubuntu VM, ensure Docker and Docker Compose are installed.

1.  **Update package index:**
    ```bash
    sudo apt-get update
    ```

2.  **Install Docker:**
    ```bash
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    ```

3.  **Verify Docker installation:**
    ```bash
    sudo docker run hello-world
    ```

## Step 1: Transfer Files to Ubuntu VM

You need to copy your project files to the VM. You can use `git` (if hosted) or `scp` (secure copy).

### Option A: Using SCP (from your Windows machine)
Open PowerShell and run the following command (replace parameters with your actual details):

```powershell
# Syntax: scp -r <local_project_path> <user>@<vm_ip_address>:<destination_path>
scp -r .\security-platform user@192.168.1.50:~/security-platform
```

### Option B: Using Git
If your project is on GitHub/GitLab:

```bash
git clone <your-repo-url>
cd security-platform
```

## Step 2: Build and Run the Container

1.  **Navigate to the project directory on your VM:**
    ```bash
    cd ~/security-platform
    ```

2.  **Ensure the `data` directory exists (if not copied):**
    ```bash
    mkdir -p data
    ```
    *Note: If you copied the folder with scp, the `data` folder should already be there with your tutorials.*

3.  **Start the application:**
    ```bash
    sudo docker compose up --build -d
    ```
    *   `--build`: Rebuilds the image to ensure latest changes.
    *   `-d`: Runs in detached mode (background).

4.  **Check Status:**
    ```bash
    sudo docker compose ps
    ```

5.  **View Logs (if needed):**
    ```bash
    sudo docker compose logs -f
    ```

## Step 3: Access the Application

Once running, access the application from your browser using the VM's IP address:

```
http://<vm_ip_address>:3000
```

### Troubleshooting

*   **Permission issues with `data` folder:**
    If the app cannot write to the `data` folder inside Docker, adjust permissions on the host:
    ```bash
    # Allow the container user (usually UID 1001 or root inside container) to write
    sudo chmod -R 777 data/
    ```

*   **Port 3000 not accessible:**
    Check your firewall (UFW) settings on Ubuntu:
    ```bash
    sudo ufw allow 3000
    ```
