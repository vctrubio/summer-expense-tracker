# Expense Tracker

This is an expense tracker application built with Convex as its backend, focusing on providing fast and easy operations for managing both expenses and deposits. The primary goal of this project was to effectively track personal money flow.

## Key Features & Usability:

- **Efficient Tracking:** Quickly add and manage expenses and deposits.
- **Enhanced Usability:** Designed with hotkeys to streamline operations and improve user experience.
- **Data Sharing:** Easily share financial data via WhatsApp API or CSV exports.

## Future Vision (V2):

The next version aims to introduce a 'pools' feature, allowing users to create designated categories or 'pools' of money. This will enable better sorting and management of expenses and withdrawals into specific financial buckets.

## Technical Details:

This project is built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend. You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).

This project is connected to the Convex deployment named [`blissful-panther-655`](https://dashboard.convex.dev/d/blissful-panther-655).

### Project Structure:

The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).

The backend code is in the `convex` directory.

`npm run dev` will start the frontend and backend servers.

### App Authentication:

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign-in. You may wish to change this before deploying your app.

### Developing and Deploying Your App:

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

### HTTP API:

User-defined HTTP routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.