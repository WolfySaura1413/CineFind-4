# CineFind — User Stories Reference

This file documents the user stories mapped to development features for tracking and pull request reference.

---

## Epic: Authentication (US-101 to US-105)

### US-101: Account Registration (MVP)
* **As a** casual viewer
* **I want to** register an account with my email and a password
* **So that** I can save my watch lists and reviews securely.

### US-102: Log In (MVP)
* **As a** registered user
* **I want to** log in with my email and password
* **So that** I can retrieve my personal watchlist, watched lists, and private reviews.

### US-103: Log Out (MVP)
* **As a** logged-in user
* **I want to** log out of the application
* **So that** other users cannot access my personal collections on this device.

### US-104: Password Reset (v1.1)
* **As a** registered user
* **I want to** request a password reset email
* **So that** I can regain access if I forget my password.

### US-105: Persistent Login Session (v1.1)
* **As a** user
* **I want** the app to remember my login state across sessions
* **So that** I do not have to enter my credentials every time I open the app.

---

## Epic: Search & Discovery (US-201 to US-206)

### US-201: Simple Search (MVP)
* **As a** casual viewer
* **I want to** search for movies and TV shows by typing their names in a search input
* **So that** I can quickly find the exact title I am looking for.

### US-202: View Search Results (MVP)
* **As a** user searching for a title
* **I want to** see a list of matched titles, including poster, name, release year, and media type (movie/TV)
* **So that** I can identify the correct title from the search results.

### US-203: Trending Feed (MVP)
* **As a** casual viewer looking for inspiration
* **I want to** view a list of trending and popular titles on the home screen
* **So that** I can discover popular content without searching.

### US-204: Filter by Media Type (v1.1)
* **As a** user searching for content
* **I want to** filter my search results to only show movies or only show TV series
* **So that** I can refine my search when a title has matching names across formats.

### US-205: View Details (MVP)
* **As a** user exploring a title
* **I want to** click on a title card to open a detailed view showing description, genre, cast (if available), average user rating, and release date
* **So that** I can decide if I want to watch it.

### US-206: "Leaving Soon" Badges (v1.2)
* **As a** user browsing titles
* **I want to** see a visual badge on titles that are leaving major streaming platforms soon
* **So that** I can prioritize watching them.

---

## Epic: Where to Watch (US-301 to US-305)

### US-301: Streaming Availability (MVP)
* **As a** user looking at a title
* **I want to** see which streaming services currently host this title (e.g. Netflix, Disney+, Prime Video)
* **So that** I know where I can watch it.

### US-302: Buy/Rent Options (MVP)
* **As a** user looking at a title not on my streaming subscriptions
* **I want to** see digital storefronts offering the title for purchase or rent
* **So that** I can buy or rent it if desired.

### US-303: Streaming Links (MVP)
* **As a** user ready to watch a title
* **I want to** tap on a streaming service logo to open that title directly in the platform's mobile app (using deep links)
* **So that** I don't have to search for the title again inside that platform.

### US-304: Country/Region Filtering (v1.1)
* **As a** user in a specific country (e.g., Portugal)
* **I want** the streaming availability to be filtered by my region
* **So that** I only see options available where I reside.

### US-305: Episode-Level Availability (v1.1)
* **As a** TV show viewer
* **I want to** see if specific seasons or episodes are available on different streaming networks
* **So that** I know where to catch up on latest releases.

---

## Epic: Watch List & Watched (US-401 to US-407)

### US-401: Add to Watch List (MVP)
* **As a** logged-in user
* **I want to** add a movie or TV show to my Watch List from a card or details page
* **So that** I can save it to watch later.

### US-402: Remove from Watch List (MVP)
* **As a** logged-in user
* **I want to** remove a title from my Watch List
* **So that** I can keep my list organized and relevant.

### US-403: Mark as Watched (MVP)
* **As a** logged-in user
* **I want to** mark a title as "Watched" (with a confirmation indicator)
* **So that** I can keep a log of everything I've seen.

### US-404: Toggle Watchlist/Watched Views (MVP)
* **As a** logged-in user
* **I want to** toggle between my "Watch List" and "Watched" list on the My Lists screen
* **So that** I can browse them separately.

### US-405: Quick Actions on Cards (MVP)
* **As a** user browsing lists or search results
* **I want to** add/remove items or mark them as watched directly from the cards using simple buttons
* **So that** I can manage my lists without opening details pages every time.

### US-406: Sort/Filter Lists (v1.1)
* **As a** user with large lists
* **I want to** sort my Watch List by added date or title name, and filter by media type (movie/TV)
* **So that** I can find specific saved items easily.

### US-407: Watchlist Sharing (v1.2)
* **As a** user proud of my watch list
* **I want to** share a link to my public Watch List with friends
* **So that** we can coordinate movie nights.

---

## Epic: Reviews (US-501 to US-507)

### US-501: Rate and Review (MVP)
* **As a** logged-in user who has watched a title
* **I want to** rate it 1–5 stars and write a short textual review
* **So that** I can log my personal thoughts.

### US-502: Review Privacy Settings (MVP)
* **As a** reviewer
* **I want to** mark my reviews as public or private
* **So that** I can choose whether to share my opinions with the community or keep them personal.

### US-503: View Reviews (MVP)
* **As a** user researching a title
* **I want to** view other users' public reviews on the details page
* **So that** I can read community feedback.

### US-504: Edit/Delete Reviews (v1.1)
* **As a** reviewer
* **I want to** edit or delete reviews I have written
* **So that** I can correct mistakes or update my rating later.

### US-505: Global Average Rating (v1.1)
* **As a** casual viewer browsing detail pages
* **I want to** see the average rating given by the community
* **So that** I can quickly gauge interest.

### US-506: Profile Review History (v1.2)
* **As a** user
* **I want to** see a list of all my reviews in one place on my Profile screen
* **So that** I can review my rating history.

### US-507: Review Likes/Comments (v1.2)
* **As a** community member
* **I want to** like or comment on other users' public reviews
* **So that** I can engage in discussions about the title.
