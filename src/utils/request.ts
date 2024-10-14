/**
 * http client
 * @author shiloh
 * @date 2024/10/14 11:10
 */
import axios from 'axios'

const http = axios.create({
  timeout: 5 * 1000,
  baseURL: 'https://api.imgbb.com'
})

export default http
