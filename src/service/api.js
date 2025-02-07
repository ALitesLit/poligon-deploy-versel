import axios from "axios";

import { BaseUrl } from "./url";


const $api = axios.create({
    baseURL: BaseUrl
});


export default $api;