import $api from "./api";


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
export const editPoligon = async ( id, name, cords ) => {
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
                    }
                ]
            })
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        })
}


// Получение всех полигонов
export const getPoligons = async () => {
    return await $api
        .get("data");
}