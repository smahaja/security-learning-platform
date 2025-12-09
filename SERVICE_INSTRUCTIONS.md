# Security Learning Platform - Service Instructions

This package contains scripts to run the application as a Windows Service. This ensures the application runs in the background and starts automatically with Windows.

## Prerequisites
- Node.js must be installed on the machine.

## Installation Steps
1. **Navigate to the Project Directory**
   Ensure your terminal is in the correct folder:
   ```powershell
   cd D:\Playground\PRJ-Security-Learning-Website1\security-platform
   ```
   *(Adjust the path if you moved the folder)*

2. **Prepare the Application**
   Run the following commands:
   ```powershell
   npm install
   npm run build
   ```
   *Note: `npm install` is only needed if dependencies are missing. `npm run build` is needed if you changed the code.*

3. **Install the Service**
   Run the following command:
   ```powershell
   node install-service.js
   ```
   *Note: This may request Administrative privileges. Click "Yes" if prompted.*

   Once complete, the service "**Security Learning Platform**" will be running.
   **Access the site at:** http://localhost:3001
   *(Note: Used port 3001 to avoid conflict with other services)*

## Managing the Service
- **Stop/Start**: Manage via Windows Services (`services.msc`). Look for "Security Learning Platform".
- **Logs**: Check the `daemon` folder in this directory for error logs.

## Uninstalling
To remove the service, run:
```powershell
node uninstall-service.js
```
