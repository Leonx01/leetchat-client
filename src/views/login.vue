<route lang="yaml">
meta:
  title: 登录
  constant: true
  layout: false
</route>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import Copyright from '@/layouts/components/Copyright/index.vue'
import useSettingsStore from '@/store/modules/settings'
import useUserStore from '@/store/modules/user'
import {useSignalChannel} from "@/store/modules/signalChannel.ts";
import apiUser from '@/api/modules/user'
import WebSocketAPI from "@/socket";
import * as stream from "stream";
defineOptions({
  name: 'Login',
})
onMounted(() => {
  // settingsStore.settings.app.colorScheme =new Date().getHours()<18&&new Date().getHours()>8? 'light':'dark'
})
const route = useRoute()
const router = useRouter()

const settingsStore = useSettingsStore()
const userStore = useUserStore()
const signalStore = useSignalChannel()
const banner = new URL('../assets/images/login-banner.svg', import.meta.url).href
const logo = new URL('../assets/images/logo.png', import.meta.url).href
const title = import.meta.env.VITE_APP_TITLE

// 表单类型，login 登录，register 注册，reset 重置密码
const formType = ref('login')
const loading = ref(false)
const redirect = ref(route.query.redirect?.toString() ?? '/MailBox/index')

// 登录
const loginFormRef = ref<FormInstance>()
const loginForm = ref({
  account: localStorage.getItem('login_account') || '',
  password: '',
  remember: !!localStorage.getItem('login_account'),
})
const loginRules = ref<FormRules>({
  account: [
    { required: true, trigger: 'blur', message: '请输入用户名' },
  ],
  password: [
    { required: true, trigger: 'blur', message: '请输入密码' },
    { min: 6, max: 18, trigger: 'blur', message: '密码长度为6到18位' },
  ],
})

function handleLogin() {
  console.log(new Date().getTime())
  loginFormRef.value && loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      userStore.login({
        account: loginForm.value.account,
        password: loginForm.value.password
      }).then((res) => {
        loading.value = false
          if (loginForm.value.remember) {
            localStorage.setItem('login_account', loginForm.value.account)
          } else {
            localStorage.removeItem('login_account')
          }
          // const socket = new WebSocketAPI('/online-status',()=>{
          //     console.log('连接成功')
          // });
        signalStore.connect(useRouter())
        // signalStore.$subscribe((mutation ,state)=>{
        //   ElMessage.success("state Change")
        //   if(state.socket==null)
        //     signalStore.connect()}
        //     , { detached: true })
          router.push(redirect.value)
      }).catch((e) => {
        ElMessage({
          message: "登陆失败",
          type: 'error',
        })
        loading.value = false

      })
    }
  })
}

// 注册
const registerFormRef = ref<FormInstance>()
const registerForm = ref({
  account: '',
  email:'',
  verifyCode: '',
  password: '',
  checkPassword: '',
})
const registerRules = ref<FormRules>({
  account: [
    { required: true, trigger: 'blur', message: '请输入电子邮箱' },
  ],
  email: [
    { required: true, trigger: 'blur', message: '请输入电子邮箱' },
    { type: 'email', trigger: 'blur', message: '请输入正确的邮箱'}
  ],
  verifyCode: [
    { required: true, trigger: 'blur', message: '请输入验证码' },
  ],
  password: [
    { required: true, trigger: 'blur', message: '请输入密码' },
    { min: 6, max: 18, trigger: 'blur', message: '密码长度为6到18位' },
  ],
  checkPassword: [
    { required: true, trigger: 'blur', message: '请再次输入密码' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        }
        else {
          callback()
        }
      },
    },
  ],
})
function handleRegister() {
  // ElMessage({
  //   message: '注册模块仅提供界面演示，无实际功能，需开发者自行扩展',
  //   type: 'warning',
  // })
  registerFormRef.value && registerFormRef.value.validate((valid) => {
    if (valid) {
      // 这里编写业务代码
      apiUser.register({
        account:registerForm.value.account,
        email:registerForm.value.email,
        password:registerForm.value.password,
        verifyCode:registerForm.value.verifyCode
      }).then((res)=>{
        if(res.code ==0)
        {
          ElMessage({
            message:'注册成功',
            type:"success",
          })
          formType.value = 'login'
        }else {
          ElMessage({
            message:res.data.description ,
            type:"error",
          })
        }
      })
    }
  })
}

// 重置密码
const resetFormRef = ref<FormInstance>()

const resetFormpassRef = ref<FormInstance>()
const resetFormpass=ref({
  newPassword:'',
  checkPassword:'',
})
const passRules=ref<FormRules>({
    newPassword: [
        { required: true, trigger: 'blur', message: '请输入新密码' },
        { min: 6, max: 18, trigger: 'blur', message: '密码长度为6到18位' },
    ],
  checkPassword: [
    { required: true, trigger: 'blur', message: '请再次输入密码' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetFormpass.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        }
        else {
          callback()
        }
      },
    },
  ],
})
const resetForm = ref({
  account: localStorage.getItem('login_account') || '',
  verifyCode: '',
  email:'',
  newPassword: '',
})
const resetRules = ref<FormRules>({
  account: [
    { required: true, trigger: 'blur', message: '请输入用户名' },
  ],
  email:[
    { required: true, trigger: 'blur', message: '请输入电子邮箱' },
    { type: 'email', trigger: 'blur', message: '请输入正确的邮箱'}
  ],
  verifyCode: [
    { required: true, trigger: 'blur', message: '请输入验证码' },
  ],

})
function handleReset() {
  // ElMessage({
  //   message: '重置密码仅提供界面演示，无实际功能，需开发者自行扩展',
  //   type: 'info',
  // })
  resetFormpassRef.value && resetFormpassRef.value.validate((valid) => {
    if(resetFormpass.value.checkPassword!== resetFormpass.value.newPassword)
    {
      ElMessage({
        message: '两次输入的密码不一致',
        type: 'error',
      })
      return
    }
    if (valid) {
      apiUser.resetPassword(
          {
            account:resetForm.value.account,
            password:resetFormpass.value.newPassword
          }
      ).then((res)=>{
        if(res.code ==0)
        {
          ElMessage({
            message:'重置密码成功',
            type:"success",
          })
          formType.value = 'login'
        }else {
          ElMessage({
            message:res.description,
            type:"error",
          })
        }
      })
    }
  })
}
function getResetVerifyCode()
{
  const account  = resetForm.value.account
  if(account==''){
    ElMessage({
      message: '请输入用户名',
      type: 'error',
    })
    return
  }
  const email  = resetForm.value.email;
  var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
  if(reg.test(email)){
    apiUser.ResetVerifyCode({
      account:account,
      email:email
    }).then((res)=>{
        console.log(res)
      if(res.code ==0)
      {
        ElMessage({
          message:'验证码已发送',
          type:"success",
        })

      }else {
        ElMessage({
          message:res.description,
          type:"error",
        })
      }
    }
    )
  }else {
    ElMessage({
      message: '请输入正确的邮箱',
      type: 'error',
    })
  }
}

function sendVerifyCode(){
  const email  = registerForm.value.email;
  var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(.[a-zA-Z0-9_-])+/;
  if(reg.test(email)){
    apiUser.getVerifyCode({
      // account:account,
      email:email
    }).then((res)=>{
        console.log(res)
      if(res.code ==0)
      {
        ElMessage({
          message:'验证码已发送',
          type:"success",
        })

      }else {
        ElMessage({
          message:res.description,
          type:"error",
        })
      }
    }
    )
  }else {
    ElMessage({
      message: '请输入正确的邮箱',
      type: 'error',
    })
  }

}
function handleValidateReset()
{
  resetFormRef.value && resetFormRef.value.validate((valid) => {
    if (valid) {
        apiUser.validateResetPassword(
            {
                account:resetForm.value.account,
                email:resetForm.value.email,
                verifyCode:resetForm.value.verifyCode
            }
        ).then((res)=>{
            if(res.code ==0)
            {
                ElMessage.success('验证成功')
                formType.value = 'resetPass'
            }else {
                ElMessage({
                    message:res.description,
                    type:"error",
                })
            }
        })
    }else{
      ElMessage({
        message: '请输入正确的信息',
        type: 'error',
      })
    }
  })
}
</script>

<template>
  <div>

    <div class="bg-banner" />
    <div id="login-box">
      <div class="login-banner">
<!--        <UserCard :fromUid="1"/>-->
        <img :src="logo" class="logo">
        <img :src="banner" class="banner">
      </div>
      <ElForm v-show="formType === 'login'" ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="title-container">
          <h3 class="title">
            欢迎来到 {{ title }} ! 🎇
          </h3>
        </div>
        <div>
          <ElFormItem prop="account">
            <ElInput v-model="loginForm.account" placeholder="用户名" type="text" tabindex="1">
              <template #prefix>
                <SvgIcon name="ri:user-3-fill" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="password">
            <ElInput v-model="loginForm.password" type="password" placeholder="密码" tabindex="2" autocomplete="new-password" show-password @keyup.enter="handleLogin">
              <template #prefix>
                <SvgIcon name="ri:lock-2-fill" />
              </template>
            </ElInput>
          </ElFormItem>
        </div>
        <div class="flex-bar">
          <ElCheckbox v-model="loginForm.remember">
            记住我
          </ElCheckbox>
          <ElLink type="success" :underline="false" @click="formType = 'reset'">
            忘记密码了?
          </ElLink>
        </div>
        <ElButton :loading="loading" type="success" size="large" style="width: 100%;" @click.prevent="handleLogin">
          登录
        </ElButton>
        <div class="sub-link">
          <span class="text">还没有帐号?</span>
          <ElLink type="success" :underline="false" @click="formType = 'register'">
            创建新帐号
          </ElLink>
        </div>
<!--        <div style="margin-top: 20px; margin-bottom: -20px; text-align: center;">-->
<!--          <ElDivider>演示账号一键登录</ElDivider>-->
<!--          <ElButton type="success" size="small" plain @click="testAccount('admin')">-->
<!--            admin-->
<!--          </ElButton>-->
<!--          <ElButton type="success" size="small" plain @click="testAccount('test')">-->
<!--            test-->
<!--          </ElButton>-->
<!--        </div>-->
      </ElForm>
      <ElForm v-show="formType === 'register'" ref="registerFormRef" :model="registerForm" :rules="registerRules" class="login-form" auto-complete="on">
        <div class="title-container">
          <h3 class="title">
            探索从这里开始! 🚀
          </h3>
        </div>
        <div>
          <ElFormItem prop="account">
            <ElInput v-model="registerForm.account" placeholder="用户名" tabindex="1">
              <template #prefix>
                <SvgIcon name="ri:user-3-fill" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="email">
            <ElInput v-model="registerForm.email" placeholder="邮箱" tabindex="1">
              <template #prefix>
                <SvgIcon name="entypo:email" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="verifyCode">
            <ElInput v-model="registerForm.verifyCode" placeholder="验证码" tabindex="2" >
              <template #prefix>
                <SvgIcon name="ic:baseline-verified-user" />
              </template>
              <template #append>
                <ElButton @click="sendVerifyCode">发送验证码</ElButton>
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="password">
            <ElInput v-model="registerForm.password" type="password" placeholder="密码" tabindex="3" show-password>
              <template #prefix>
                <SvgIcon name="ri:lock-2-fill" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="checkPassword">
            <ElInput v-model="registerForm.checkPassword" type="password" placeholder="确认密码" tabindex="4" show-password>
              <template #prefix>
                <SvgIcon name="ri:lock-2-fill" />
              </template>
            </ElInput>
          </ElFormItem>
        </div>
        <ElButton :loading="loading" type="success" size="large" style="width: 100%; margin-top: 20px;" @click.prevent="handleRegister">
          注册
        </ElButton>
        <div class="sub-link">
          <span class="text">已经有帐号?</span>
          <ElLink type="success" :underline="false" @click="formType = 'login'">
            去登录
          </ElLink>
        </div>
      </ElForm>
      <ElForm v-show="formType === 'reset'" ref="resetFormRef" :model="resetForm" :rules="resetRules" class="login-form">
        <div class="title-container">
          <h3 class="title">
            账号验证 🔒
          </h3>
        </div>
        <div>
          <ElFormItem prop="account">
            <ElInput v-model="resetForm.account" placeholder="用户名" tabindex="1">
              <template #prefix>
                <SvgIcon name="ri:user-3-fill" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="email">
            <ElInput v-model="resetForm.email" placeholder="邮箱" type="text" tabindex="1">
              <template #prefix>
                <SvgIcon name="entypo:email" />
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem prop="verifyCode">
            <ElInput v-model="resetForm.verifyCode" placeholder="验证码" type="text" tabindex="2">
              <template #prefix>
                <SvgIcon name="ic:baseline-verified-user" />
              </template>
              <template #append>
                <ElButton @click="getResetVerifyCode">发送验证码</ElButton>
              </template>
            </ElInput>
          </ElFormItem>
        </div>
        <ElButton :loading="loading" type="success" size="large" style="width: 100%; margin-top: 20px;" @click="handleValidateReset">
          下一步
        </ElButton>
        <div class="sub-link">
          <span class="text">想起密码了?</span>
          <ElLink type="success" :underline="false" @click="formType = 'login'">
            返回登录
          </ElLink>
        </div>

      </ElForm>
        <ElForm v-show="formType === 'resetPass'" :model="resetFormpass" ref="resetFormpassRef" :rules="passRules" class="login-form">
            <div class="title-container">
                <h3 class="title">
                    重置密码 📕
                </h3>
            </div>
            <ElFormItem prop="newPassword">
                <ElInput v-model="resetFormpass.newPassword" type="password" placeholder="新密码" tabindex="3" show-password>
                    <template #prefix>
                        <SvgIcon name="ri:lock-2-fill" />
                    </template>
                </ElInput>
            </ElFormItem>
            <ElFormItem prop="newPasswordCheck">
                <ElInput v-model="resetFormpass.checkPassword" type="password" placeholder="确认密码" tabindex="3" show-password>
                    <template #prefix>
                        <SvgIcon name="ri:lock-2-fill" />
                    </template>
                </ElInput>
            </ElFormItem>
          <ElButton :loading="loading" type="success" size="large" style="width: 100%; margin-top: 20px;" @click="handleReset">
            确认
          </ElButton>
<!--            <div class="sub-link">-->
<!--                <ElLink type="success" :underline="false" @click="formType = 'login'" v-show="resetSuccess==1">-->
<!--                    去登录-->
<!--                </ElLink>-->
<!--            </div>-->
        </ElForm>
    </div>
    <Copyright />
  </div>
</template>

<style lang="scss" scoped>
[data-mode="mobile"] {
  #login-box {
    position: relative;
    top: inherit;
    left: inherit;
    flex-direction: column;
    justify-content: start;
    width: 100%;
    height: 100%;
    border-radius: 0;
    box-shadow: none;
    transform: translateX(0) translateY(0);

    .login-banner {
      width: 100%;
      padding: 20px 0;

      .banner {
        position: relative;
        top: inherit;
        right: inherit;
        display: inherit;
        width: 100%;
        max-width: 375px;
        margin: 0 auto;
        transform: translateY(0);
      }
    }

    .login-form {
      width: 100%;
      min-height: auto;
      padding: 30px;
    }
  }

  .copyright {
    position: relative;
  }
}

:deep(input[type="password"]::-ms-reveal) {
  display: none;
}

.bg-banner {
  position: fixed;
  z-index: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, var(--g-container-bg), var(--g-bg));
}

#login-box {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
  background-color: var(--g-container-bg);
  border-radius: 10px;
  box-shadow: var(--el-box-shadow);
  transform: translateX(-50%) translateY(-50%);

  .login-banner {
    position: relative;
    width: 450px;
    overflow: hidden;
    background-color: var(--g-bg);

    .banner {
      width: 100%;

      @include position-center(y);
    }

    .logo {
      position: absolute;
      top: 20px;
      left: 20px;
      height: 30px;
      border-radius: 4px;
      box-shadow: var(--el-box-shadow-light);
    }
  }

  .login-form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 500px;
    min-height: 500px;
    padding: 50px;
    overflow: hidden;

    .title-container {
      position: relative;

      .title {
        margin: 0 auto 30px;
        font-size: 1.3em;
        font-weight: bold;
        color: var(--el-text-color-primary);
      }
    }
  }

  .el-form-item {
    margin-bottom: 24px;

    :deep(.el-input) {
      width: 100%;
      height: 48px;
      line-height: inherit;

      input {
        height: 48px;
      }

      .el-input__prefix,
      .el-input__suffix {
        display: flex;
        align-items: center;
      }

      .el-input__prefix {
        left: 10px;
      }

      .el-input__suffix {
        right: 10px;
      }
    }
  }

  :deep(.el-divider__text) {
    background-color: var(--g-container-bg);
  }

  .flex-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    :deep(.el-checkbox) {
      color: var(--el-text-color-secondary);
    }

    :deep(.el-checkbox__label) {
      color: var(--el-text-color-secondary);
    }

    :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
      color: var(--el-text-color-secondary);
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner),
    :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
      background-color: var(--el-color-success);
      border-color: var(--el-color-success);
    }

    :deep(.el-checkbox__inner:hover) {
      border-color: var(--el-color-success);
    }
  }

  .sub-link {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    .text {
      margin-right: 10px;
    }
  }

  :deep(.el-link__inner) {
    color: var(--el-color-success);
    transition: opacity 0.16s ease;
  }

  :deep(.el-link__inner:hover) {
    opacity: 0.85;
  }
}

.copyright {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 20px;
  margin: 0;
}
</style>
