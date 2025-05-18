# World End Tree

This project is a unique application that fetches your personal music data from the Spotify Web API. It visualizes your top 10 songs of the month in an interactive 3D "minimal world tree" using React Three Fiber.

## Features
- **Spotify Integration:** Fetches your top 10 songs of the month using the Spotify Web API.
- **3D Visualization:** Presents your songs as a hierarchical tree, with the 10th most listened-to song at the bottom and your #1 song at the top.
- **Interactive UI:** Hover over a song's point to see its details (title, artist, etc.).
- **State Management:** Uses Zustand to manage Spotify data and interactive elements of the 3D visualization.

## Tech Stack
- React
- React Three Fiber
- Zustand
- Spotify Web API

## Project Goal
To create a visually engaging and interactive way to explore your monthly music trends, blending data visualization with creative 3D graphics. 

## Application Flow

```mermaid
graph TD
    A[User's Browser] -->|Accesses Web App| B(Frontend Web App)
    B -->|Initiates OAuth 2.0 PKCE Flow| C(Spotify Authorization Service)
    C -->|Redirects with Authorization Code| B
    B -->|Exchanges Code for Access Token| C
    B -->|Requests Top Tracks Data| D(Spotify Web API)
    D -->|Returns JSON Data| B
    B -->|Processes Data & Updates State| E(Zustand Store)
    E -->|Provides Data to UI Components| F(React Three Fiber / React Components)
    F -->|Renders 3D Tree Visualization| G[User Sees Visualization]
    G -->|User Interaction (Hover, Orbit)| B
``` 
