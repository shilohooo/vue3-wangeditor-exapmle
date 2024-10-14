<template>
  <div style="padding: 10px">
    <div>
      <Toolbar
        style="border: 1px solid #ccc"
        :editor="editorRef"
        :defaultConfig="toolbarConfig"
        :mode="mode"
      />
      <Editor
        style="border: 1px solid #ccc;height: 300px;overflow-y: scroll;border-top: none"
        v-model="valueHtml"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
        @customAlert="customAlert"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
  import { type IDomEditor, type IEditorConfig, type IToolbarConfig } from '@wangeditor/editor';
  import http from './utils/request.ts';
  import type { ImgBBRes } from './types/img-bb.ts';
  import { closeToast, showLoadingToast, showNotify, showToast } from 'vant';

  type InsertFnType = (url: string, alt: string, href: string) => void
  const IMG_BB_API_KEY = '0343fa0b43a376501f87859b0aaca16e'

  // 编辑器实例，必须用 shallowRef
  const editorRef = shallowRef<IDomEditor>();
  // 编辑器模式：default | simple，设置为 simple 时，可隐藏选中文本时的 hoverbar
  const mode = 'simple'

  // 内容 HTML
  const valueHtml = ref('');

  // 模拟 ajax 异步获取内容
  onMounted(() => {
    // setTimeout(() => {
    //   valueHtml.value = '<p>模拟 Ajax 异步设置内容</p>';
    // }, 1500);
  });

  // 工具栏配置：https://www.wangeditor.com/v5/toolbar-config.html
  const toolbarConfig: Partial<IToolbarConfig> = {
    // https://www.wangeditor.com/v5/toolbar-config.html#toolbarkeys
    toolbarKeys: [
      // 标题选择
      'headerSelect',
      // 分割线
      '|',
      // 粗体
      'bold',
      // 斜体
      'italic',
      // 下划线
      'underline',
      // 删除线
      'through',
      // 字体大小
      'fontSize',
      // 字体颜色
      'color',
      // 插入链接
      'insertLink',
      // 上传图片
      'uploadImage',
      // emoji
      'emotion',
    ]
  };
  // 编辑器配置：https://www.wangeditor.com/v5/editor-config.html
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入通知内容...',
    readOnly: false,
    // 菜单配置
    MENU_CONF: {
      // 插入链接
      'insertLink': {
        /**
         * 插入链接时的校验
         *
         * 返回值有三种选中
         * 1. 返回 true ，说明检查通过，编辑器将正常插入链接
         * 2. 返回一个字符串，说明检查未通过，编辑器会阻止插入。会 alert 出错误信息（即返回的字符串）
         * 3. 返回 undefined（即没有任何返回），说明检查未通过，编辑器会阻止插入。但不会提示任何信息
         * @param _text 链接文本
         * @param url 链接地址
         * @author shiloh
         * @date 2024/10/14 10:21
         */
        checkLink: (_text: string, url: string): string | boolean => {
          if (!url) {
            return true
          }

          if (!/^(http:\/\/|https:\/\/)/.test(url)) {
            return `链接地址[${url}]必须以 http:// 或 https:// 开头`
          }

          return true;
        }
      },
      // 上传图片
      'uploadImage': {
        // 服务器图片上传接口地址，必填，否则上传图片会报错
        // 注意：接口响应数据格式要求如下所示：
        // 上传成功：
        // {
        //   "errno": 0, // 注意：值是数字，不能是字符串
        //   "data": {
        //     "url": "xxx", // 图片 src ，必须
        //     "alt": "yyy", // 图片描述文字，非必须
        //     "href": "zzz" // 图片的链接，非必须
        //   }
        // }
        // 上传失败：
        // {
        //   "errno": 1, // 只要不等于 0 就行
        //   "message": "失败信息"
        // }
        // server: 'https://api.imgbb.com/1/upload',
        // 自定义 formData fileName，默认值：wangeditor-uploaded-image
        // fileName: 'file',
        // 单个文件的最大体积限制，默认为：2M，单位：bytes
        maxFileSize: 1024 * 1024 * 5,
        // 附加上传参数，比如传递用于接口鉴权的 token，参数会被添加到 formData 中
        // meta: {
        //   key: ''
        // },
        // 是否将 meta 拼接到 url 参数中，默认为：false
        // metaWithUrl: false,
        // 自定义增加 http  header
        // headers: {
        //   Accept: 'application/json;charset=utf-8',
        //   Authorization: 'your access token'
        // },
        // 跨域是否传递 cookie ，默认为 false
        // withCredentials: true,
        // 超时时间，默认为 10 秒
        // timeout: 5 * 1000, // 5 秒
        // 图片大小小于该值就转化为 base64，而不是上传到服务器，单位：bytes
        // base64LimitSize: 1024 * 5,
        /**
         * 如果你不想使用 wangEditor 自带的上传功能，例如你要上传到阿里云 OSS 。可以通过 customUpload 来自定义上传。
         * @param file 选中的图片文件
         * @param insertFn 回调函数，将图片 url 插入到编辑器中
         * @author shiloh
         * @date 2024/10/14 11:06
         */
        async customUpload(file: File, insertFn: InsertFnType) {
          showLoadingToast('图片上传中，请稍等...')
          // 自己实现上传，并得到图片 url alt href
          const res = await http.postForm<ImgBBRes>('/1/upload', {
            image: file,
            key: IMG_BB_API_KEY,
            name: file.name
          })
          const resData = res.data as ImgBBRes
          console.log('img bb api res data', resData)
          // 最后插入图片
          insertFn(resData.data.display_url, file.name, '')
          closeToast()
          showToast({ type: 'success', message: '上传成功', duration: 1000, forbidClick: true })
        }
      }
    }
  };

  // 组件销毁时，也及时销毁编辑器
  onBeforeUnmount(() => {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }

    editor.destroy();
  });

  const handleCreated = (editor: IDomEditor) => {
    console.log('>================ toolbar menu keys ===============<')
    console.log(editor.getAllMenuKeys());
    console.log('>================ toolbar menu keys ===============<')
    // 记录 editor 实例，重要！
    editorRef.value = editor;
  };

  /**
   * 自定义警告提示
   * @param info 提示信息
   * @param type 提示类型：'error' | 'warning' | 'info' | 'success'
   * @author shiloh
   * @date 2024/10/14 11:37
   */
  const customAlert = (info: string, type: string) => {
    console.log('custom alert', info, type)
    switch (type) {
      case 'error':
        showNotify({ type: 'danger', message: info })
        break
      case 'warning':
      case 'success':
        showNotify({ type, message: info })
        break
      case 'info':
      default:
        showNotify({ type: 'primary', message: info })
        break
    }
  }

  watch(valueHtml, () => {
    console.log('new html content: ', valueHtml.value)
    console.log('new html content size: ', valueHtml.value.length)
  })
</script>

<style scoped></style>
