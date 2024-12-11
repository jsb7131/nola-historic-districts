# Nola Historic Districts

Nola Historic Districts is a Next.js project that leverages [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides) to display New Orleans [Local Historic District](https://gis.nola.gov/arcgis/rest/services/dev/property3/MapServer/4) geometries on an interactive map.

Click a geometry to see basic information about the selected district in a pop-up!

## Running Locally

1. Clone the repository

    ```bash
    git clone https://github.com/jsb7131/nola-historic-districts.git
    ```

2. Run `npm install` to install the dependencies

    ```bash
    cd nola-historic-districts
    npm install
    ```

3. Create an account at [mapbox.com](https://www.mapbox.com/) to obtain a Mapbox access token, add a .env file at the root of the project, and add these environment variables to the file

    ```bash
    NEXT_PUBLIC_MAPBOX_TOKEN=<YourAccessToken>
    NEXT_PUBLIC_GIS_NOLA_API_URL=https://gis.nola.gov/arcgis/rest/services/dev/property3/MapServer
    ```

4. Run `npm run dev` to start the development server

    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
