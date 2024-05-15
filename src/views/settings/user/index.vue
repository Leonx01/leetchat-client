<route lang="yaml">
name: personalSetting
meta:
title: 个人设置
cache: false
</route>

<script setup lang="ts">
// import {ElMessage} from 'element-plus'
const userStore = useUserStore()
import {ElMessage, FormInstance, FormRules} from "element-plus";
import useUserStore from '@/store/modules/user'
import apiUser from "@/api/modules/user.ts";
function handleReset() {
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
            account:useUserStore().account,
            password:resetFormpass.value.newPassword
          }
      ).then((res:any)=>{
        if(res.code ==0)
        {
          ElMessage({
            message:'重置密码成功',
            type:"success",
          })
          // formType.value = 'login'
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
function handleUpdateUserInfo() {
  userRef.value && userRef.value.validate((valid) => {
    if (valid) {
      let data={
        // uname:user.value.uname?user.value.uname:'',
        unick:user.value.unick?user.value.unick:'',
        selfInfo:user.value.selfInfo?user.value.selfInfo:'',
      }
      apiUser.updateUserInfo(data).then((res:any)=>{
        if(res.code ==0)
        {
          ElMessage({
            message:'更新用户信息成功',
            type:"success",
          })
          // formType.value = 'login'
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
const userRef=ref<FormInstance>()
const user=ref({
  uid:1,
  uname:'admin',
  unick:'admin',
  selfInfo:'admin',
  avatar:'https://avatars.githubusercontent.com/u/44036559?v=4',
  email:'dadad@qq.com',
})
const userRules=ref<FormRules>({
  uname: [
    { required: true, trigger: 'blur', message: '请输入用户名' },
    { pattern: /^[a-zA-Z_]+$/, message: '用户名只能包含字母和下划线' },
  ],
  unick: [
    { required: true, trigger: 'blur', message: '请输入昵称' },
  ],
  selfInfo: [
    { required: true, trigger: 'blur', message: '请输入简介' },
  ],
})
const fileList=ref([])
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
function uploadAvatar(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let file = fileList.value[0] as any;
    console.log(file)
    let formData = new FormData();
    formData.append('fileName',file.name);
    formData.append('file',file.raw);
    let type = file.raw.type;
    if(type.indexOf('image')==-1)
    {
      ElMessage({
        message: '请上传图片文件',
        type: 'error',
      })
      return
    }
    apiUser.uploadAvatar(formData).then((res: any) => {
      if (res.code === 0) {
        ElMessage({
          message: '上传头像成功',
          type: "success",
        });
        user.value.avatar = res.data.url;
        userStore.setAvatar(res.data.url)
        resolve(res); // resolve Promise with response data
      } else {
        ElMessage({
          message: res.description,
          type: "error",
        });
        reject(new Error(res.description)); // reject Promise with error description
      }
    }).catch((error: any) => {
      reject(error); // reject Promise with error object
    });
  });
}

onMounted(() => {
  apiUser.getUserSetting().then((res:any)=>{
    if(res.code ==0)
    {
      user.value=res.data
    }else{
      ElMessage({
        message:res.description,
        type:"error",
      })
    }
  })
})
</script>
<script lang="ts">
// import apiUser from "../../api/modules/user";
// import api from "@";

export default {
  data() {
    return {
      reset: false,
      basicEditable: false,
      background: {
        colorA: '',
        colorB: '',
      },

    }


  }
  ,
  computed:{
        bannerStyle(){
          return {
        // 'linear-gradient(135deg, #3498db, #6ab8e1)',
        background: this.background.colorA && this.background.colorB ? `linear-gradient(135deg,${this.background.colorA}, ${this.background.colorB})` : 'linear-gradient(135deg,rgba(19, 206, 102, 0.8), #6ab8e1)',
        height: '40px',
            width: '240px'
      }
    },
  },
}

</script>
<template>
  <div>
    <PageMain >
      <ElTabs tab-position="top" style="height:700px;"  type="border-card">
        <ElTabPane class="basic">
          <template #label>
        <span class="custom-tabs-label">
          <ElRow>
            <ElCol :span="12">
              <SvgIcon name="mdi:account"/>
            </ElCol>
          <ElCol :span="12">
            <span>基本信息</span>
          </ElCol>
          </ElRow>
        </span>
          </template>
          <h3>基本信息</h3>
          <ElRow :gutter="20">
            <ElCol :span="16">
              <ElForm :model="user" label-width="120px" label-suffix="：" ref="userRef" :rules="userRef">
                <ElFormItem label="头像">
                  <div class="headimg-upload">
                      <el-tooltip
                          class="box-item"
                          effect="dark"
                          content="点击上传头像"
                          placement="bottom"
                          >
                        <ElUpload
                            v-model:file-list="fileList"
                            accept="image/*"
                            class="avatar-uploader"
                            :http-request="uploadAvatar"
                            :show-file-list="false"
                        >
                          <el-image
                              style="width: 100px; height: 100px"
                              :src="user.avatar"
                              fit="cover"
                          />
                        </ElUpload>
                      </el-tooltip>
                  </div>
                </ElFormItem>
                <ElFormItem label="ID" >
                  <ElInput v-model="user.uid" :value="user.uid"  style="width: 200px;" disabled/>
                </ElFormItem>
                <ElFormItem label="用户名">
                  <ElInput v-model="user.uname" :value="user.uname"  style="width: 200px;" disabled/>
                </ElFormItem>
                <ElFormItem label="昵称">
                  <ElInput v-model="user.unick" :value="user.unick"  style="width: 200px;" :disabled="!basicEditable" clearable/>
                </ElFormItem>
                <ElFormItem label="简介">
                  <ElInput v-model="user.selfInfo" :value="user.selfInfo"  style="width: 400px;" :disabled="!basicEditable"
                  type="textarea" maxlength="200" show-word-limit :rows="6"/>
                </ElFormItem>
                <ElFormItem>
                  <div  style="display:flex;justify-content: center;align-items: center">
                  <ElButton type="success" @click="basicEditable=true" v-if="!basicEditable">
                    修改
                  </ElButton>
                  <ElButton type="success" @click="basicEditable=false" v-else>
                    保存
                  </ElButton>
                  </div>
                </ElFormItem>
              </ElForm>
            </ElCol>
          </ElRow>
        </ElTabPane>
        <ElTabPane  class="security">
          <template #label>
            <span class="custom-tabs-label">
          <ElRow>
            <ElCol :span="12">
          <SvgIcon name="mdi:security-lock-outline"/>
            </ElCol>
          <ElCol :span="12">
        <span>安全设置</span>
          </ElCol>
          </ElRow>


            </span>
          </template>
          <h3>安全设置</h3>
          <div class="setting-list">
            <ElRow>
              <ElCol :md="24" :lg="12">
                <ElForm label-width="120px">
                  <ElFormItem label="安全邮箱" prop="password">

                    <el-tooltip
                        class="box-item"
                        effect="dark"
                        content="暂不支持修改邮箱"
                        placement="bottom"
                    >
                      <ElInput v-model="user.email" id="formPasswd" style="width: 200px" disabled>
                        <template #prefix>
                          <SvgIcon name="mdi:email"/>
                        </template>
                      </ElInput>
                    </el-tooltip>
                  </ElFormItem>
                  <ElFormItem>
<!--                    <div  style="display:flex;justify-content: center;align-items: center">-->
                      <ElButton type="success" @click="reset=true">
                        修改密码
                      </ElButton>
                  </ElFormItem>

                </ElForm>
              </ElCol>
            </ElRow>
            <!--              <FixedActionBar>-->

            <!--              </FixedActionBar>-->
          </div>
        </ElTabPane>
        <ElTabPane class="preference">
          <template #label>
            <span class="custom-tabs-label" >
          <ElRow>
            <ElCol :span="12">
          <SvgIcon name="mdi:security-lock-outline"/>
            </ElCol>
          <ElCol :span="12">
        <span>个性化</span>
          </ElCol>
          </ElRow>
            </span>
          </template>
          <h3>个性化</h3>
          <div class="setting-list">
            <el-color-picker v-model="background.colorA" show-alpha></el-color-picker>
            <div class="banner" :style="bannerStyle"></div>
            <el-color-picker v-model="background.colorB" show-alpha></el-color-picker>
          </div>
        </ElTabPane>
      </ElTabs>
    </PageMain>
    <el-dialog title="修改密码" v-model="reset"  width="30%" center :show-close="false">
      <ElForm :model="resetFormpass" ref="resetFormpassRef" :rules="passRules" class="login-form">
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
        <ElButton type="success" size="large" style="width: 100%; margin-top: 20px;" @click="handleReset">
          确认
        </ElButton>
        <!--            <div class="sub-link">-->
        <!--                <ElLink type="success" :underline="false" @click="formType = 'login'" v-show="resetSuccess==1">-->
        <!--                    去登录-->
        <!--                </ElLink>-->
        <!--            </div>-->
      </ElForm>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-tabs) {
  .el-tabs__header .el-tabs__nav {
    .el-tabs__active-bar {
      z-index: 0;
      width: 100%;
      background-color: var(--el-color-success-light-9);
      border-right: 2px solid var(--el-color-success);
      transition: transform 0.3s, background-color 0.3s, var(--el-transition-border);
    }

    .el-tabs__item {
      text-align: left;
      padding-right: 100px;
    }
    .el-tabs__item  {
      text-align: left;
      padding-right: 100px;
    }
  }

  .el-tab-pane {
    padding: 0 20px 0 30px;
  }
}

h2 {
  margin: 0;
  margin-bottom: 0px;
  font-weight: normal;
}

.basic {
  :deep(.headimg-upload) {
    text-align: center;

    .el-upload-dragger {
      border-radius: 50%;
    }
  }
}

.center-container {
  display: flex;
  justify-content: flex-start;
  margin-left: 25%;
}

.security {
  .setting-list {
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      transition: var(--el-transition-border);

      .content {
        .title {
          margin-bottom: 5px;
          color: var(--el-color-black);
          transition: var(--el-transition-color);
        }

        .desc {
          font-size: 14px;
          color: var(--el-color-black);
          transition: var(--el-transition-color);
        }
      }

      &:last-child {
        border-bottom: 0;
      }
    }
  }
}
</style>
