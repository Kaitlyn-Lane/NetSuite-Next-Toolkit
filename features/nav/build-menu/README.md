This folder contains the logic for building and storing a json version of the nav. 

# High Level Appraoch and Design 
Button on popup triggers opening of the nav and scraping of that page. 
If you take a look at NetSuite's network tab you can trace /navigation calls, that is how NetSuite gathers to data
I went with webscraping because the response of those calls do not include the final url instead it will return the type and ids
(ex. you'll see suitlet type, script id 1234 and deployment id 1)
So to avoid building the urls from those response I just scrape the data, and store it in memory
This means changes to the nav will not automatically be reflected in the nav

## Note on small screens
NetSuite Next handles small screens gracefully and resizes the nav menu. The DOM selectors in that view are different though. 
This logic is untested on small screens and probably will not work. 
