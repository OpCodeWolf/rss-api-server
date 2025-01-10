# RSS API Server Endpoint Specification

## Project Description
The RSS API Server is a RESTful API designed to manage and serve RSS feeds. It provides endpoints for user authentication, including login and user management, as well as functionalities to add, update, delete, and retrieve RSS streams and items. The server is built using Node.js and Express, leveraging middleware for session management and logging. It supports CORS for cross-origin requests and utilizes a database for user and RSS feed storage.

## 1. GET /
- **Summary**: Get root response
  - This endpoint serves as a health check for the API. It returns a simple message indicating that the server is running. It can be used to verify that the API is accessible.
- **Responses**:
  - **200**: 
    ```json
    {
      "version": "1.0.0", 
      "description": "RSS News Feed Server.", 
      "status": "ok"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to retrieve root response"
    }
    ```

## 2. GET /rss
- **Summary**: Get RSS feed
  - This endpoint retrieves the current RSS feed. It returns the feed in XML format, which can be consumed by RSS readers. The feed includes channel information and individual items.
- **Responses**:
  - **200**: 
    ```xml
    <rss>
      <channel>
        <title>Example RSS Feed</title>
        <link>http://example.com</link>
        <description>This is an example RSS feed</description>
        <item>
          <title>Item 1</title>
          <link>http://example.com/item1</link>
          <description>Description of item 1</description>
          <image>http://example.com/image1.jpg</image>
        </item>
      </channel>
    </rss>
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to generate RSS feed"
    }
    ```

## 3. GET /opml
- **Summary**: Retrieve the OPML file
  - This endpoint generates and returns the OPML file containing the RSS feed links.
- **Responses**:
  - **200**: Returns the OPML file in XML format.
  - **500**: 
    ```json
    {
      "error": "Failed to generate OPML file"
    }
    ```

## 4. GET /rss_streams
- **Summary**: Get all RSS streams
  - This endpoint retrieves a list of all RSS streams that have been added to the server. It returns an array of stream objects, each containing an ID, link, title, and description.
- **Responses**:
  - **200**: 
    ```json
    [
      {
        "id": 1,
        "link": "http://example.com/rss1",
        "title": "Example RSS Stream 1",
        "description": "Description of RSS Stream 1"
      },
      {
        "id": 2,
        "link": "http://example.com/rss2",
        "title": "Example RSS Stream 2",
        "description": "Description of RSS Stream 2"
      }
    ]
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to retrieve RSS streams"
    }
    ```

## 5. POST /rss_streams
- **Summary**: Add an RSS stream
  - This endpoint allows users to add a new RSS stream by providing a link to the feed. It validates the input and, if successful, stores the stream in the database.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **Properties**:
      - link: string
- **Responses**:
  - **201**: 
    ```json
    {
      "message": "RSS stream added successfully",
      "id": 3
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Link is required"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to add RSS stream"
    }
    ```

## 6. DELETE /rss_streams/{id}
- **Summary**: Delete an RSS stream by ID
  - This endpoint allows users to delete an existing RSS stream by specifying its ID. If the stream is successfully deleted, a 204 No Content response is returned.
- **Parameters**:
  - id: integer (required)
- **Responses**:
  - **204**: No content
  - **400**: 
    ```json
    {
      "error": "Invalid ID"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to delete RSS stream"
    }
    ```

## 7. POST /rss_update_streams
- **Summary**: Update RSS feeds
  - This endpoint triggers an update of the RSS feeds. It can be used to refresh the content of the feeds based on the stored links. A successful update will return a confirmation message.
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "RSS feeds updated successfully"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to update RSS feeds"
    }
    ```

## 8. GET /rss_items
- **Summary**: Get all RSS items
  - This endpoint retrieves all items from the RSS feeds. It supports pagination and ordering by publication date, allowing clients to fetch items in a structured manner.
- **Parameters**:
  - pubDateOrder: string (optional)
  - page: integer (optional)
  - page_size: integer (optional)
- **Responses**:
  - **200**: 
    ```json
    [
      {
        "id": 1,
        "title": "Item 1",
        "link": "http://example.com/item1"
      },
      {
        "id": 2,
        "title": "Item 2",
        "link": "http://example.com/item2"
      }
    ]
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to retrieve RSS items"
    }
    ```

## 9. DELETE /rss_items/{id}
- **Summary**: Delete a RSS item by ID
  - This endpoint allows users to delete a specific RSS item by its ID. A successful deletion will return a confirmation message.
- **Parameters**:
  - id: integer (required)
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "RSS item deleted successfully"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to delete RSS item"
    }
    ```

## 10. POST /rss_items
- **Summary**: Update RSS items
  - This endpoint allows users to update existing RSS items by providing the necessary details in the request body. It can handle both single item updates and bulk updates.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **OneOf**:
      - **Properties**: id, title, description, link, pubDate
      - **Array of objects** with the same properties
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "RSS items updated successfully"
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Invalid input"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to update RSS items"
    }
    ```

## 11. POST /login
- **Summary**: User login
  - This endpoint authenticates users by validating their credentials. Upon successful login, it returns a token and user level that can be used for subsequent requests requiring authentication.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **Properties**: username, password
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "Successful login",
      "token": "c689b78d-53b4-47d2-82ad-456166c384ea",
      "level": "user"
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Username and password are required"
    }
    ```
  - **401**: 
    ```json
    {
      "error": "Invalid username or password"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to login"
    }
    ```

## 12. POST /logout
- **Summary**: User logout
  - This endpoint logs the user out of the session. It invalidates the session token, ensuring that the user can no longer access protected resources without logging in again.
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "Successful logout"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to logout"
    }
    ```

## 13. POST /create_user
- **Summary**: Create a new user
  - This endpoint allows for the registration of a new user by providing a username and password. It checks for existing usernames to prevent duplicates and returns the newly created user's ID and token upon success.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **Properties**: username, password
- **Responses**:
  - **201**: 
    ```json
    {
      "message": "User created successfully",
      "id": 1,
      "token": "c689b78d-53b4-47d2-82ad-456166c384ea"
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Username and password are required"
    }
    ```
  - **409**: 
    ```json
    {
      "error": "Username already exists"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to create user"
    }
    ```

## 14. POST /update_user
- **Summary**: Allows an admin to update a user's account
  - This endpoint enables administrators to modify user details, including username, password, and user level. It requires authentication and proper permissions to execute.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **Properties**: username, password, token, user_level
- **Responses**:
  - **200**: 
    ```json
    {
      "message": "Successful update"
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Input user object is required"
    }
    ```

## 15. DELETE /delete_user/{username}
- **Summary**: Delete a user by username
  - This endpoint allows administrators to delete a user account by specifying the username. It ensures that the user is removed from the system entirely.
- **Parameters**:
  - username: string (required)
- **Responses**:
  - **204**: No content
  - **404**: 
    ```json
    {
      "error": "User not found"
    }
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to delete user"
    }
    ```

## 16. POST /encrypt
- **Summary**: Encrypt a string using bcrypt
  - This endpoint provides functionality to encrypt a given string (typically a password) using bcrypt. It returns the hashed value, which can be stored securely.
- **Request Body**:
  - **Required**: true
  - **Content**: application/json
    - **Properties**: input
- **Responses**:
  - **200**: 
    ```json
    {
      "hash": "$2b$10$EIXZ..."
    }
    ```
  - **400**: 
    ```json
    {
      "error": "Input string is required"
    }
    ```

## 17. GET /users
- **Summary**: List all users with pagination
  - This endpoint retrieves a paginated list of all users in the system. It can be used by administrators to view user accounts and their associated details.
- **Parameters**:
  - page: integer (optional)
  - page_size: integer (optional)
- **Responses**:
  - **200**: 
    ```json
    [
      {
        "id": 1,
        "username": "user1",
        "user_level": "ADMIN"
      },
      {
        "id": 2,
        "username": "user2",
        "user_level": "USER"
      }
    ]
    ```
  - **500**: 
    ```json
    {
      "error": "Failed to fetch users"
    }
