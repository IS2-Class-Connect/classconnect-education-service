## Table of Contents

- [Description](#description)
- [Endpoints](#endpoints)
- [Technologies](#technologies)
- [Project Setup](#project-setup)
- [Running the Project](#running-the-project)
- [Database Configuration](#database-configuration)
- [Using this Template](#using-this-template)
- [⚠️ Branch Protection Recommendation](#️-branch-protection-recommendation)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Support](#support)
- [License](#license)
- [Code Style](#code-style)
- [Codecov](#Codecov)

## Description

This repository is a template for creating microservices for the Class-Connect application. It uses **NestJS**, **Prisma**, and **TypeScript** with a **package-layered architecture**. The template is intentionally minimal and ready to be customized for each specific microservice.

## Endpoints

- To test the API, you can use tools like Postman or send curl requests.

- To create a course using curl:

```bash
    curl -X POST 'https://<host_url>/courses' \
    -H 'Content-Type: application/json' \
    -d '{
    "title": "Course title",
    "description": "Course description",
    "teacherId": <teacher_id>,
    "startDate": <start_date>,
    "endDate": <end_date>,
    "registrationDeadline": <registration_deadline>,
    "totalPlaces": 100
    }'
```

- To get all courses:

```bash
curl -X GET 'https://<host_url>/courses'
```

- To get course by id:

```bash
curl -X GET 'https://<host_url>/courses/{id}'
```

- To patch title, description, startDate, endDate, registrationDeadline, teacherId and totalPlaces course by id (every property mentioned is optional):

```bash
curl -X PATCH 'http://<host_url>/courses/{id}' \
-H 'Content-Type: application/json' \
-d '{
  "title"?: "Updated title",
  "description"?: "Updated description",
  "totalPlaces"?: 200,
  "userId": <user_id>,
  ...
}'
```

- To delete a course by id:

```bash
curl -X DELETE 'https://<host_url>/courses/{id}'
```

- To create a course enrollment using curl:

```bash
    curl -X POST 'https://<host_url>/courses/{course_id}/enrollments' \
    -H 'Content-Type: application/json' \
    -d '{
    "userId": <user_id>,
    "role": <role>,
    }'
```

- To get all enrollments for a specific course:

```bash
curl -X GET 'https://<host_url>/courses/{course_id}/enrollments'
```

- To get enrollments matching a specific filter:

```bash
curl -X GET 'https://<host_url>/courses/enrollments<filters>'
```

- To get all enrollments:

```bash
curl -X GET 'https://<host_url>/courses/enrollments'
```

- To patch a course enrollment favorite status or role (every property mentioned is optional) using curl:

```bash
    curl -X PATCH 'https://<host_url>/courses/{course_id}/enrollments/{userId}' \
    -H 'Content-Type: application/json' \
    -d '{
    "favorite": true,
    "role": <role>,
    }'
```

- To delete a course enrollment by the course id and user id:

```bash
curl -X DELETE 'https://<host_url>/courses/{course_id}/enrollments/{user_id}'
```

- To get the course activity (the movements done by the head teacher or assistants):

```bash
curl 'https://<host_url>/courses/{course_id}/activities'
```

- To create a course module:

```bash
curl 'https://<host_url>/courses/{course_id}/modules' \
-H 'Content-Type: application/json' \
-d '{
"title": "Title",
"description": "Description",
"order": <order>,
"userId": <user_id>
}'
```

- To get a module by id:

```bash
curl 'https://<host_url>/courses/{course_id}/modules/{module_id}'
```

- To get all modules for a course:

```bash
curl 'https://<host_url>/courses/{course_id}/modules'
```

- To update a course module by id (all properties are optional):

```bash
curl -X PATCH 'https://<host_url>/courses/{course_id}/modules/{module_id}' \
-H 'Content-Type: application/json' \
-d '{
"title"?: "Updated Title",
"description"?: "Updated Description",
"order"?: <order>,
"userId": <user_id>
}'
```

- To delete a course module by id:

```bash
curl -X DELETE 'https://<host_url>/courses/{course_id}/modules/{module_id}'
```

- To create a resource for a course module:

```bash
curl -X POST 'https://<host_url>/courses/{course_id}/modules/{module_id}/resources' \
-H 'Content-Type: application/json' \
-d '{
    "link": "https://resource-link.com",
    "dataType": <data_type>,
    "order": <order>,
    "userId": <user_id>
}'
```

- To get a module resource by link:

```bash
curl 'https://<host_url>/courses/{course_id}/modules/{module_id}/resources/{link}'
```

- To get all resources for a course module:

```bash
curl 'https://<host_url>/courses/{course_id}/modules/{module_id}/resources'
```

- To patch a module resource:

```bash
curl 'https://<host_url>/courses/{course_id}/modules/{module_id}/resources/{link}' \
-H 'Content-Type: application/json' \
-d '{
"order": <order>,
"userId": <user_id>"
}'
```

- To delete a module resource:

```bash
curl -X GET 'https://<host_url>/courses/{course_id}/modules/{module_id}/resources/{link}?userId={user_id}'
```

- To create course feedback:

```bash
curl -X POST 'https://<host_url>/courses/{course_id}/enrollments/{user_id}/courseFeedback' \
-H 'Content-Type: application/json' \
-d '{
    "courseNote": 5,
    "courseFeedback": "Great course!"
}'
```

- To get course feedback by student and course id:

```bash
curl 'https://<host_url>/courses/{course_id}/enrollments/{user_id}/courseFeedback'
```

- To get all feedback for a course:

```bash
curl 'https://<host_url>/courses/{course_id}/feedbacks'
```

- To create student feedback:

```bash
curl -X POST 'https://<host_url>/courses/{course_id}/enrollments/{user_id}/studentFeedback' \
-H 'Content-Type: application/json' \
-d '{
    "studentFeedback": "Excellent participation",
    "studentNote": 4,
    "teacherId": <teacher_id>
}'
```

- To get student feedback by student and course id:

```bash
curl 'https://<host_url>/courses/{course_id}/enrollments/{user_id}/studentFeedback'
```

- To get all feedback for a student:

```bash
curl 'https://<host_url>/courses/studentFeedbacks/{student_id}'
```

- To create an assessment for a course:

```bash
curl -X POST 'https://<host_url>/courses/{course_id}/assessments' \
-H 'Content-Type: application/json' \
-d '{
    "title": "Assessment Title",
    "description": "Assessment Description",
    "type": <assessment_type>,
    "startTime": <start_time>,
    "deadline": <deadline>,
    "toleranceTime": 60,
    "userId": <user_id>
    "exercises": [
        {
            "type": "Written",
            "question": "What is an API?",
            "link"?: "https://example-link.com"
        },
        {
            "type": "Mc",
            "question": "Is this an example?",
            "choices": ["Yes", "No"],
            "correctChoiceIdx": 0,
            "link"?: "https://example-link.com"
        },
        ...
    ]
}'
```

- To get all assessments for a course:

```bash
curl 'https://<host_url>/courses/{course_id}/assessments'
```

- To get assessments matching a filter:

```bash
curl 'https://<host_url>/assessments/{filter}'
```

- To get an assessment by id:

```bash
curl 'https://<host_url>/assessments/{asses_id}'
```

- To update an assessment by id:

```bash
curl -X PATCH 'https://<host_url>/courses/{course_id}/assessments/{asses_id}' \
-H 'Content-Type: application/json' \
-d '{
    "title"?: "Updated Exam Title",
    "description"?: "Updated description",
    "userId": "<user_id>",
    ...
}'
```

- To delete an assessment by ID:

```bash
curl -X DELETE 'https://<host_url>/courses/{course_id}/assessments/{asses_id}'
```

- To create a submission for an assessment:

```bash
curl -X POST 'https://<host_url>/assessments/{assessment_id}/submissions' \
-H 'Content-Type: application/json' \
-d '{
    "userId": <user_id>,
    "answers": ["1", "I don’t know", ...]
}'
```

- To get all submissions for an assessment:

```bash
curl 'https://<host_url>/assessments/{assessment_id}/submissions'
```

- To get a submission by assessment and user id:

```bash
curl 'https://<host_url>/assessments/{assessment_id}/submissions/{user_id}'
```

- to create/update a correction for a specified submission

```bash
curl -X POST 'https://<host_url>/assessments/{assessment_id}/submissions/{user_id}/correction' \
-H 'Content-Type: application/json' \
-d '{
"teacherId": <teacher_id>,
"corrections": ["Very Good!", "This exercise was difficult, but you did it well ;)"]},
"feedback": "The exam is well done, congrats",
"note": 7
}'
```

### Variables

`<start_date>`, `<end_date>`, `<registration_date>`, `<start_time>` and `<deadline>` are strings of the dates in ISO 8601 format: `YYYY-mm-ddThh:mm:ssZ`. \
`<teacher_id>` and `<user_id>` must match with the `uuid` used in users service. \
`<user_id>` is required when requesting any endpoint allowed just to authorized users, or when needed to identify any entity (e.x. `enrollments`). \
`<role>` must be `"STUDENT"` or `"ASSISTANT"`. \
`<filters>` are _query params_ which can include an enrollment `userId` and/or `role`. \
`<order>` is the integer indicating the order of the module/resource in the course/module modules/resources list.
`<data_type>` must be `"IMAGE"`, `"VIDEO"`, `"LINK"`.

## Technologies

- **NestJS**: A progressive Node.js framework for building efficient and scalable server-side applications.
- **Prisma**: A next-generation ORM for database management.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Package-Layered Architecture**: A modular architecture pattern for better scalability and maintainability.

## Project Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (default database, can be switched to MongoDB if needed)

### Installation

Clone the repository and install dependencies:

```bash
$ git clone <repository-url>
$ cd classconnect-base-service
$ npm install
```

## Running the Project

### Development Mode

```bash
$ npm run start
```

### Watch Mode

```bash
$ npm run start:dev
```

### Production Mode

```bash
$ npm run start:prod
```

## Database Configuration

By default, this template is configured to use **PostgreSQL**. You can modify the database configuration in the `prisma/schema.prisma` file to switch to **MongoDB** or another database if required.

To migrate the database schema:

```bash
$ npx prisma migrate dev
```

To generate Prisma client:

```bash
$ npx prisma generate
```

## Using this Template

You can create a new repository from this template by clicking the **"Use this template"** button on GitHub. After cloning, make sure to:

- Run `npm install` to install dependencies.
- Update the `.env.example` file and create your own `.env`.
- Initialize your own Prisma schema.
- Configure GitHub Actions if needed.

## ⚠️ Branch Protection Recommendation

After creating a new repository from this template, we recommend you:

1. Go to `Settings > Branches` in your GitHub repository.
2. Add a protection rule for the `main` branch:
   - ✅ Require status checks to pass before merging.
   - ✅ Require branches to be up to date.
   - ❌ Review requirement is optional.
   - ✅ Block direct pushes (recommended).

## Testing

This project uses **Jest** for unit testing. To run tests:

```bash
$ npm run test
```

To run tests with coverage:

```bash
$ npm run test:cov
```

Tests will automatically run on every push or pull request to `main` via GitHub Actions.

## Project Structure

```
src/
├── controllers/
├── services/
├── modules/
├── entities/
├── repositories/
├── main.ts
├── app.module.ts
prisma/
├── schema.prisma
.github/
└── workflows/
    └── ci.yml
```

## Support

This template is open source and licensed under the MIT license. Contributions and feedback are welcome.

## License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Code Style

We use **Prettier** and **ESLint** to maintain consistent code formatting and quality. Use the following commands:

- To check and fix lint issues:

```bash
$ npm run lint
```

- To format files using Prettier:

```bash
$ npm run format
```

- To check formatting without making changes:

```bash
$ npm run format:check
```

## Codecov

[![codecov](https://codecov.io/github/IS2-Class-Connect/classconnect-education-service/graph/badge.svg?token=6UAWRK2GS6)](https://codecov.io/github/IS2-Class-Connect/classconnect-education-service)
