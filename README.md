# Taskwise_backend

TaskWise is a task management API that allows users to manage workspaces, projects, tasks efficiently.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [License](#license)

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/AbhishekGogoi/Taskwise_backend.git
```

1. **Navigate to the project directory:**
cd TaskWise

2. **Install dependencies:**
npm install

3. **Set up environment variables:**
Create a .env file in the root directory and add the following variables:

PORT=8080
MONGODB_URI=mongodb://localhost:27017/taskwise 
Adjust the PORT and MONGODB_URI values as needed.
AWS_ACCESS_KEY_ID = ""
AWS_SECRET_ACCESS_KEY = ""
S3_REGION = ""
S3_BUCKET = ""

4. **Start the server:**
npm start

5. **Usage: TaskWise provides the following features:**
Workspace Management: Organize projects into workspaces for better collaboration.
Project Management: Create, update, and delete projects.

6. **API Documentation: Explore the API endpoints and their usage with Swagger UI.**
The API documentation can be accessed at http://localhost:8080/api-docs when the server is running. It provides detailed information about the available endpoints and their usage.