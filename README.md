# Fatplants

1. Install Node 20 with nvm
2. [Angular CLI](https://github.com/angular/angular-cli) version 18.2.13.
3. Make sure you have package-lock.json and then run `npm ci`
4. Run `npx ng serve`, `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

# FatPlant Deployment
npx ng build --configuration production


# Get chatbot dropdown list
MATCH (p:Pathway)
RETURN properties(p) AS pathway_properties
