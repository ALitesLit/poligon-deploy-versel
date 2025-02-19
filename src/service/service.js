import $api from "./api";
import { convertCords } from "./convert";


// Данные для авторизации админа
var admin = { 
    "login": "admin@ibronevik.ru",
    "password": "p@ssw0rd",
    "type": "e-mail" 
}; 


// Получение данных авторизации админа
export const getToken = async () => {
    const data = await $api
        .post("auth", admin, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

    const auth_hash = data.data.auth_hash;

    const token = await $api
        .post("token", {"auth_hash": auth_hash}, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        });
        
    return {
        admin_token: token.data.data.token,
        admin_u_hash: token.data.data.u_hash
    }
}


// Создание / редактирование полигонов
export const editPoligon = async ( id, name, cords, center, radius ) => {
    const admin = await getToken();

    return await $api
        .post("data", {
            "token": admin.admin_token, 
            "u_hash": admin.admin_u_hash, 
            "data": JSON.stringify(
            {
                "map_place_polygons":[
                    {
                        "id": `${id}`,
                        "var": name,
                        "coordinates":
                        [
                            cords
                        ],
                        "ru": name,
                        "json": {
                            "center": JSON.stringify(center),
                            "radius": radius
                        }
                    }
                ]
            })
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        })
}


// Создание / редактирование полигонов
export const deletePoligon = async ( id ) => {
    const admin = await getToken();

    return await $api
        .post("data", {
            "token": admin.admin_token, 
            "u_hash": admin.admin_u_hash,
            "data": JSON.stringify(
            {
                "map_place_polygons": [{
                    "id": id,
                    ":del": 1
                }]
            })
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        })
}


// Получение всех полигонов
export const getPoligons = async () => {
    const { data } = await $api
        .get("data");

    const polygons = data.data.data.map_place_polygons;
    const finalPoligons = [];

    if (localStorage.getItem("version") != data.data.version) {
        for (var key in polygons) {
            finalPoligons.push(
                {
                    id: key,
                    name: polygons[key].ru,
                    positions: polygons[key].coordinates.map(
                        i => convertCords(i)
                    )[0],
                    center: polygons[key].json?.center ? JSON.parse(polygons[key].json.center) : {lat: 28.139243010859918, lng: -39.95810974631667},
                    type: "polygon",
                    radius: polygons[key].json?.radius ? polygons[key].json.radius : 0,
                    color: "#67c85e"
                }
            );
        }

        localStorage.setItem("version", data.data.version);
        localStorage.setItem("polygons", JSON.stringify(finalPoligons));
    }
    

    return polygons;
}