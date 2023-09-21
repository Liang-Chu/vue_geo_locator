# Vue Location App

## Author
Liang Chu

## Contact Information
For any queries, please contact me at liamchu@trentu.ca.

## System Requirements
- Node.js (version 14 or higher)
- Yarn package manager

## Build Guide
1. Install dependencies using yarn:
    ```bash
    yarn install
    ```
2. Install vue3-google-maps and axios:
    ```bash
    yarn add vue3-google-maps axios
    ```
3. To start the development server, run:
    ```bash
    yarn serve
    ```
4. To build the application for production, run:
    ```bash
    yarn build
    ```

## Functionality
- A button to acquire the user's current location from their browser.
- A search module that lets users input the name of a location. The search feature is triggered by both button clicks and pressing the enter key on the keyboard.
- Display the location on a map and add a marker to each searched location every time the location changes.
- A table with pagination to show all searched places:
  - Display a maximum of 10 records on each page.
  - A checkbox at the beginning of each row to let users select multiple records at the same time.
  - A delete button on the top to remove all selected records as well as their markers on the map.
- Display the time zone and local time of the latest searched location.

## Highlights
- The data will be stored in case the user needs to leave or accidentally refreshes the page.
- The user can delete all data with the "delete all" button in the corner.
- The local clock for the most recent geo search result is displayed in the right top corner.
- The "current location" button is also considered as a search and will be added to the list as well.

