
// Dictionnaire associant les codes météo personnalisés aux chemins des images correspondantes
const weatherIcons = {
    0: "img/soleil.png",         // 0 → ciel clair : icône soleil
    1: "img/pluvieux.png",       // 1 → partiellement nuageux (ici icône pluvieux, mais attention, c’est trompeur)
    2: "img/orage.png",          // 2 → orage : icône orage
    3: "img/couvert.png",        // 3 → couvert : icône ciel couvert
    4: "img/nuageux.png",        // 4 → nuageux : icône nuageux
    5: "img/nuage-pluie.png"     // 5 → pluie légère : icône nuage + pluie légère
};


// Fonction qui convertit un code météo Open-Meteo en un code personnalisé pour choisir l’icône correspondante
function mapWeatherCodeToCustomCode(weathercode) {

    if (weathercode === 0) return 0;                      // 0 = ciel clair → icône 0 (soleil.png)
    if (weathercode === 1) return 0;                      // 1 = principalement clair → aussi icône 0 (soleil.png)

    if (weathercode === 2) return 3;                      // 2 = partiellement nuageux → icône 3 (couvert.png)
    if (weathercode === 3) return 3;                      // 3 = couvert → icône 3 (couvert.png)

    if ([45, 48].includes(weathercode)) return 3;         // 45, 48 = brouillard ou brouillard givrant → icône 3 (couvert.png ou nuageux.png par défaut)

    if ([51, 53, 55, 61, 63, 65].includes(weathercode)) return 4; // codes pluie légère à modérée → icône 4 (nuageux.png)

    if ([71, 73, 75].includes(weathercode)) return 5;     // codes neige légère → icône 5 (nuage-pluie.png ici, mais ça devrait être une icône neige si possible)

    if ([95, 96, 99].includes(weathercode)) return 2;     // codes orage → icône 2 (orage.png)

    return 3; // Par défaut (codes non listés) → icône 3 (couvert.png)
}


// Fonction pour obtenir les coordonnées (latitude/longitude) à partir du nom d'une ville
async function getCoordinates(city) {
    // URL de l'API de géocodage (Open-Meteo), encodeURIComponent permet de gérer les espaces et caractères spéciaux
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

    // Requête HTTP à l'API
    const response = await fetch(url);
    const data = await response.json();

    console.log(data.results); // Affiche les résultats dans la console pour débogage

    // Vérifie que des résultats existent
    if (data.results && data.results.length > 0) {
        // On récupère les infos principales du 1er résultat (le plus pertinent)
        const { latitude, longitude, name, country } = data.results[0];
        return { latitude, longitude, name, country }; // Retourne les coordonnées + nom + pays
    } else {
        // En cas d'absence de résultat
        throw new Error("Ville introuvable");
    }
}



// Fonction pour obtenir les données météo à partir des coordonnées géographiques
async function getWeather(latitude, longitude) {
    // Appel de l’API météo Open-Meteo pour récupérer la météo actuelle
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    // Si les données météo actuelles sont disponibles
    if (data.current_weather) {
        return {
            temperature: data.current_weather.temperature,     // température en °C
            weathercode: data.current_weather.weathercode,     // code météo (ex: ciel clair, pluie, etc.)
            is_day: data.current_weather.is_day                // 1 = jour, 0 = nuit
        };
    } else {
        throw new Error("Données météo indisponibles");
    }
}



// Quand l'utilisateur clique sur le bouton "🔍"
document.getElementById('search-btn').addEventListener('click', async () => {
    // Récupère la valeur saisie dans la barre de recherche
    const cityInput = document.getElementById('search-bar').value.trim();

    // Vérifie que l’utilisateur a bien entré quelque chose
    if (!cityInput) {
        alert('Merci de saisir une ville');
        return;
    }

    try {
        //  Obtenir les coordonnées de la ville
        const { latitude, longitude, name } = await getCoordinates(cityInput);

        //  Obtenir la météo à partir des coordonnées
        const { temperature, weathercode, is_day } = await getWeather(latitude, longitude );

        //  Modifier le fond de la page selon jour/nuit
        const body = document.body;
        if (is_day === 1) {
            body.style.background = "linear-gradient(to bottom, #1faee7ff, #fff)"; // fond clair pour le jour
              
        } else {
            body.style.background = "linear-gradient(to bottom, #051e44ff, #000)"; // fond sombre pour la nuit
        } 
        

        //  Mise à jour des coordonnées affichées
        document.getElementById("latitude-bar").value = latitude;
        document.getElementById("longitude-bar").value = longitude;

        //  Mise à jour des infos météo dans la page
        document.getElementById('city-name').textContent = name; // nom de la ville
        document.getElementById('temperaturee').textContent = ` ${temperature} °C`; // température

        //  Affichage de l’icône météo
        const customCode = mapWeatherCodeToCustomCode(weathercode); // conversion du code météo
        const iconSrc = weatherIcons[customCode] || "img/.png";     // chemin de l’icône
        document.getElementById("weather-icon").src = iconSrc;

    } catch (err) {
        //  Gestion des erreurs (ville non trouvée, problème API, etc.)
        alert(err.message);
        document.getElementById('city-name').textContent = '';      // Vide le champ nom de ville
        document.getElementById('temperaturee').textContent = ' °C'; // Vide le champ température
        document.getElementById("weather-icon").src = "";           // Supprime l’icône
    }
});


function getMyPosition() {
        // Vérifie si la géolocalisation est disponible dans le navigateur
    if ("geolocation" in navigator) {
        // Si oui, tente de récupérer la position
        navigator.geolocation.getCurrentPosition(
            onPosition, // Callback en cas de succès (déjà définie dans ton autre code)
            () => {
                alert("Impossible de récupérer votre position."); // En cas d’erreur
            }
        );
    } else {
        // Si la géolocalisation n'est pas supportée
        alert("Géolocalisation non supportée !");
    }
}


// Fonction asynchrone qui sera appelée lorsqu'une position géographique est obtenue
async function onPosition(position_obj) {
    // Récupère la latitude et la longitude à partir de l'objet de position
    const latitude = position_obj.coords.latitude;
    const longitude = position_obj.coords.longitude;

    // Met à jour les champs de coordonnées dans l'interface utilisateur
    document.getElementById('latitude-bar').value = latitude;
    document.getElementById('longitude-bar').value = longitude;

    try {
        // Appelle une fonction asynchrone pour obtenir la météo à partir des coordonnées
        const { temperature, weathercode , is_day} = await getWeather(latitude, longitude);

        // Met à jour l'affichage de la ville et de la température
        document.getElementById('city-name').textContent = "Ma position";
        document.getElementById('temperaturee').textContent = ` ${temperature} °C`;

        // Convertit le code météo en un code personnalisé pour choisir l'icône appropriée
        const customCode = mapWeatherCodeToCustomCode(weathercode);
        
        // Change le background en fonction de la meteo
        const body = document.body;
        if (is_day === 1) {
            body.style.background = "linear-gradient(to bottom, #1faee7ff, #fff)"; // fond clair pour le jour
              
        } else {
            body.style.background = "linear-gradient(to bottom, #051e44ff, #000)"; // fond sombre pour la nuit
        } 

        // Récupère l'URL de l'icône météo correspondante à ce code
        const iconSrc = weatherIcons[customCode] || ""; // Si aucun code trouvé, icône vide

        // Met à jour l'image de l'icône météo dans l'interface
        document.getElementById("weather-icon").src = iconSrc;

    } catch (err) {
        // En cas d'erreur (ex. : échec de l'appel à l'API météo), afficher une alerte
        alert("Erreur lors de la récupération de la météo : " + err.message);

        // Réinitialise les informations météo affichées
        document.getElementById('city-name').textContent = '';
        document.getElementById('temperaturee').textContent = ' °C';
        document.getElementById("weather-icon").src = "";
        
    }
}




