/**
 * img bb 图片上传响应数据结构
 * @author shiloh
 * @date 2024/10/14 11:16
 */
export interface ImgBBRes {
  data: Data
  success: boolean
  status: number
}

export interface Data {
  id: string
  title: string
  url_viewer: string
  url: string
  display_url: string
  width: number
  height: number
  size: number
  time: number
  expiration: number
  image: Image
  thumb: Thumb
  delete_url: string
}

export interface Image {
  filename: string
  name: string
  mime: string
  extension: string
  url: string
}

export interface Thumb {
  filename: string
  name: string
  mime: string
  extension: string
  url: string
}

