<route lang="yaml">
name: personalSetting
meta:
title: 个人设置
cache: false
</route>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import useUserStore from '@/store/modules/user'
import apiUser from '@/api/modules/user.ts'

const userStore = useUserStore()
const reset = ref(false)
const basicEditable = ref(false)
const cropDialogVisible = ref(false)
const cropImageUrl = ref('')
const cropScale = ref(1)
const cropOffsetX = ref(0)
const cropOffsetY = ref(0)
const cropNaturalWidth = ref(0)
const cropNaturalHeight = ref(0)
const cropPreviewImage = ref<HTMLImageElement | null>(null)
const cropStageRef = ref<HTMLElement | null>(null)
const draggingCrop = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOriginX = ref(0)
const dragOriginY = ref(0)
const cropStageSize = 280
const cropOutputSize = 512
const background = ref({
  colorA: '',
  colorB: '',
})

const bannerStyle = computed(() => ({
  background: background.value.colorA && background.value.colorB
    ? `linear-gradient(135deg, ${background.value.colorA}, ${background.value.colorB})`
    : 'linear-gradient(135deg, rgba(88, 101, 242, 0.75), rgba(59, 165, 93, 0.8))',
  height: '52px',
  width: '100%',
  borderRadius: '10px',
}))

const displayAvatar = computed(() => {
  const a = user.value.avatar
  if (!a) return ''
  if (/^https?:\/\//i.test(a)) return a
  const base = (import.meta.env.VITE_APP_API_BASEURL as string) || ''
  return base ? `${base.replace(/\/$/, '')}${a.startsWith('/') ? a : `/${a}`}` : a
})

function handleReset() {
  resetFormpassRef.value && resetFormpassRef.value.validate((valid) => {
    if (resetFormpass.value.checkPassword !== resetFormpass.value.newPassword) {
      ElMessage({
        message: '两次输入的密码不一致',
        type: 'error',
      })
      return
    }
    if (valid) {
      apiUser.resetPassword(
        {
          account: useUserStore().account,
          password: resetFormpass.value.newPassword,
        },
      ).then((res: any) => {
        if (res.code == 0) {
          ElMessage({
            message: '重置密码成功',
            type: 'success',
          })
          reset.value = false
          resetFormpass.value.newPassword = ''
          resetFormpass.value.checkPassword = ''
        }
        else {
          ElMessage({
            message: res.description,
            type: 'error',
          })
        }
      })
    }
  })
}

function handleResetDialogClosed() {
  resetFormpass.value.newPassword = ''
  resetFormpass.value.checkPassword = ''
  resetFormpassRef.value?.clearValidate()
}

function handleUpdateUserInfo() {
  userRef.value && userRef.value.validate((valid) => {
    if (valid) {
      const data = {
        unick: user.value.unick ? user.value.unick : '',
        selfInfo: user.value.selfInfo ? user.value.selfInfo : '',
      }
      apiUser.updateUserInfo(data).then((res: any) => {
        if (res.code == 0) {
          ElMessage({
            message: '更新用户信息成功',
            type: 'success',
          })
          basicEditable.value = false
          if (user.value.unick) userStore.setNickname(user.value.unick)
        }
        else {
          ElMessage({
            message: res.description,
            type: 'error',
          })
        }
      })
    }
  })
}

function toggleBasicEdit() {
  if (!basicEditable.value) {
    basicEditable.value = true
    return
  }
  handleUpdateUserInfo()
}

const userRef = ref<FormInstance>()
const user = ref({
  uid: 1,
  uname: '',
  unick: '',
  selfInfo: '',
  avatar: '' as string,
  email: '',
})
const userRules = ref<FormRules>({
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
const fileList = ref<any[]>([])
const resetFormpassRef = ref<FormInstance>()
const resetFormpass = ref({
  newPassword: '',
  checkPassword: '',
})
const passRules = ref<FormRules>({
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
const cropDisplayWidth = computed(() => cropNaturalWidth.value * getEffectiveScale())
const cropDisplayHeight = computed(() => cropNaturalHeight.value * getEffectiveScale())
const cropImageStyle = computed(() => ({
  width: `${cropDisplayWidth.value}px`,
  height: `${cropDisplayHeight.value}px`,
  transform: `translate(${cropOffsetX.value}px, ${cropOffsetY.value}px)`,
}))

function resetCropState() {
  cropImageUrl.value = ''
  cropScale.value = 1
  cropOffsetX.value = 0
  cropOffsetY.value = 0
  cropNaturalWidth.value = 0
  cropNaturalHeight.value = 0
  cropPreviewImage.value = null
}

function getEffectiveScale() {
  if (!cropNaturalWidth.value || !cropNaturalHeight.value) {
    return 1
  }
  const baseScale = Math.max(cropStageSize / cropNaturalWidth.value, cropStageSize / cropNaturalHeight.value)
  return baseScale * cropScale.value
}

function clampCropOffset() {
  const displayWidth = cropDisplayWidth.value
  const displayHeight = cropDisplayHeight.value

  if (displayWidth <= cropStageSize) {
    cropOffsetX.value = Math.round((cropStageSize - displayWidth) / 2)
  }
  else {
    const minX = cropStageSize - displayWidth
    cropOffsetX.value = Math.max(minX, Math.min(0, cropOffsetX.value))
  }

  if (displayHeight <= cropStageSize) {
    cropOffsetY.value = Math.round((cropStageSize - displayHeight) / 2)
  }
  else {
    const minY = cropStageSize - displayHeight
    cropOffsetY.value = Math.max(minY, Math.min(0, cropOffsetY.value))
  }
}

async function prepareCropFromFile(file: any) {
  if (!file?.raw) {
    return
  }
  if (!String(file.raw.type || '').includes('image')) {
    ElMessage.error('请上传图片文件')
    return
  }
  const objectUrl = URL.createObjectURL(file.raw)
  const image = new Image()
  image.src = objectUrl
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
  })

  cropPreviewImage.value = image
  cropNaturalWidth.value = image.naturalWidth
  cropNaturalHeight.value = image.naturalHeight
  cropScale.value = 1
  cropImageUrl.value = objectUrl
  cropOffsetX.value = Math.round((cropStageSize - cropDisplayWidth.value) / 2)
  cropOffsetY.value = Math.round((cropStageSize - cropDisplayHeight.value) / 2)
  clampCropOffset()
  cropDialogVisible.value = true
}

function onAvatarSelect(file: any) {
  fileList.value = []
  prepareCropFromFile(file).catch(() => {
    ElMessage.error('读取图片失败')
  })
}

function onCropScaleChange() {
  clampCropOffset()
}

function handleCropPointerDown(event: PointerEvent) {
  if (!cropImageUrl.value) {
    return
  }
  if (event.button !== 0) {
    return
  }
  draggingCrop.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  dragOriginX.value = cropOffsetX.value
  dragOriginY.value = cropOffsetY.value
  event.preventDefault()
  cropStageRef.value?.setPointerCapture(event.pointerId)
}

function handleCropPointerMove(event: PointerEvent) {
  if (!draggingCrop.value || (event.buttons & 1) === 0) {
    return
  }
  const deltaX = event.clientX - dragStartX.value
  const deltaY = event.clientY - dragStartY.value
  cropOffsetX.value = dragOriginX.value + deltaX
  cropOffsetY.value = dragOriginY.value + deltaY
  clampCropOffset()
}

function handleCropPointerUp(event: PointerEvent) {
  if (!draggingCrop.value) {
    return
  }
  draggingCrop.value = false
  cropStageRef.value?.releasePointerCapture(event.pointerId)
}

function handleCropWheel(event: WheelEvent) {
  event.preventDefault()
  const next = cropScale.value + (event.deltaY < 0 ? 0.05 : -0.05)
  cropScale.value = Math.max(1, Math.min(3, Number(next.toFixed(2))))
  clampCropOffset()
}

function closeCropDialog() {
  cropDialogVisible.value = false
  if (cropImageUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropImageUrl.value)
  }
  resetCropState()
}

async function confirmCropUpload() {
  if (!cropPreviewImage.value || !cropNaturalWidth.value || !cropNaturalHeight.value) {
    return
  }

  const displayWidth = cropDisplayWidth.value
  const displayHeight = cropDisplayHeight.value
  const sx = Math.max(0, -cropOffsetX.value * (cropNaturalWidth.value / displayWidth))
  const sy = Math.max(0, -cropOffsetY.value * (cropNaturalHeight.value / displayHeight))
  const sWidth = Math.min(cropNaturalWidth.value, cropStageSize * (cropNaturalWidth.value / displayWidth))
  const sHeight = Math.min(cropNaturalHeight.value, cropStageSize * (cropNaturalHeight.value / displayHeight))

  const canvas = document.createElement('canvas')
  canvas.width = cropOutputSize
  canvas.height = cropOutputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    ElMessage.error('头像裁剪失败')
    return
  }
  ctx.drawImage(cropPreviewImage.value, sx, sy, sWidth, sHeight, 0, 0, cropOutputSize, cropOutputSize)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png', 0.92))
  if (!blob) {
    ElMessage.error('头像裁剪失败')
    return
  }

  const formData = new FormData()
  const fileName = `avatar-${Date.now()}.png`
  formData.append('fileName', fileName)
  formData.append('file', blob, fileName)

  apiUser.uploadAvatar(formData).then((res: any) => {
    if (res.code === 0) {
      ElMessage.success('上传头像成功')
      user.value.avatar = res.data.url
      userStore.setAvatar(res.data.url)
      closeCropDialog()
      return
    }
    ElMessage.error(res.description || '上传头像失败')
  }).catch(() => {
    ElMessage.error('上传头像失败')
  })
}

onMounted(() => {
  apiUser.getUserSetting().then((res: any) => {
    if (res.code == 0) {
      user.value = res.data
      if (res.data?.avatar) {
        const a = res.data.avatar
        const fullUrl = /^https?:\/\//i.test(a)
          ? a
          : `${(import.meta.env.VITE_APP_API_BASEURL as string || '').replace(/\/$/, '')}${a.startsWith('/') ? a : `/${a}`}`
        userStore.setAvatar(fullUrl)
      }
      if (res.data?.unick != null && res.data.unick !== '') {
        userStore.setNickname(res.data.unick)
      }
    }
    else {
      ElMessage({
        message: res.description,
        type: 'error',
      })
    }
  })
})
</script>
<template>
  <PageMain class="setting-page">
    <div class="settings-shell">
      <ElTabs tab-position="top" class="settings-tabs">
        <ElTabPane class="basic">
          <template #label>
            <span class="tab-label">
              <SvgIcon name="mdi:account" />
              <span>基本信息</span>
            </span>
          </template>
          <section class="panel-card">
            <h3>基本信息</h3>
            <p class="panel-desc">
              管理头像、昵称和个人简介，这些信息会展示在聊天与资料卡片中。
            </p>
            <ElForm ref="userRef" :model="user" :rules="userRules" label-width="120px" label-suffix="：">
              <ElFormItem label="头像">
                <div class="basic-headline">
                  <ElUpload
                    v-model:file-list="fileList"
                    accept="image/*"
                    class="avatar-uploader"
                    :auto-upload="false"
                    :show-file-list="false"
                    :on-change="onAvatarSelect"
                  >
                    <el-image class="avatar-image" :src="displayAvatar" fit="cover">
                      <template #error>
                        <div class="avatar-fallback">
                          <SvgIcon name="carbon:user-avatar-filled-alt" :size="48" class="text-gray-500" />
                        </div>
                      </template>
                    </el-image>
                    <div class="avatar-mask">
                      裁剪并上传
                    </div>
                  </ElUpload>
                </div>
              </ElFormItem>
              <ElFormItem label="ID">
                <ElInput v-model="user.uid" disabled class="input-short" />
              </ElFormItem>
              <ElFormItem label="用户名" prop="uname">
                <ElInput v-model="user.uname" disabled class="input-short" />
              </ElFormItem>
              <ElFormItem label="昵称" prop="unick">
                <ElInput v-model="user.unick" :disabled="!basicEditable" clearable class="input-short" />
              </ElFormItem>
              <ElFormItem label="简介" prop="selfInfo">
                <ElInput
                  v-model="user.selfInfo"
                  :disabled="!basicEditable"
                  type="textarea"
                  maxlength="200"
                  show-word-limit
                  :rows="6"
                  class="input-long"
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="success" class="action-btn" @click="toggleBasicEdit">
                  {{ basicEditable ? '保存资料' : '编辑资料' }}
                </ElButton>
              </ElFormItem>
            </ElForm>
          </section>
        </ElTabPane>

        <ElTabPane class="security">
          <template #label>
            <span class="tab-label">
              <SvgIcon name="mdi:security-lock-outline" />
              <span>安全设置</span>
            </span>
          </template>
          <section class="panel-card">
            <h3>安全设置</h3>
            <p class="panel-desc">
              保护账号访问安全，建议定期更新密码并保持邮箱可用。
            </p>
            <ElForm label-width="120px">
              <ElFormItem label="安全邮箱">
                <el-tooltip effect="dark" content="暂不支持修改邮箱" placement="bottom">
                  <ElInput v-model="user.email" disabled class="input-short">
                    <template #prefix>
                      <SvgIcon name="mdi:email" />
                    </template>
                  </ElInput>
                </el-tooltip>
              </ElFormItem>
              <ElFormItem>
                <ElButton type="success" class="action-btn" @click="reset = true">
                  修改密码
                </ElButton>
              </ElFormItem>
            </ElForm>
          </section>
        </ElTabPane>

        <ElTabPane class="preference">
          <template #label>
            <span class="tab-label">
              <SvgIcon name="mdi:palette-outline" />
              <span>个性化</span>
            </span>
          </template>
          <section class="panel-card">
            <h3>个性化</h3>
            <p class="panel-desc">
              自定义主题渐变预览，匹配你的视觉偏好。
            </p>
            <div class="preference-grid">
              <div class="picker-group">
                <span>主色</span>
                <el-color-picker v-model="background.colorA" show-alpha />
              </div>
              <div class="picker-group">
                <span>辅色</span>
                <el-color-picker v-model="background.colorB" show-alpha />
              </div>
              <div class="banner-preview">
                <div class="banner" :style="bannerStyle" />
              </div>
            </div>
          </section>
        </ElTabPane>
      </ElTabs>
    </div>

    <el-dialog
      v-model="reset"
      title="修改密码"
      width="420px"
      center
      :show-close="false"
      class="reset-dialog"
      @closed="handleResetDialogClosed"
    >
      <ElForm ref="resetFormpassRef" :model="resetFormpass" :rules="passRules" class="login-form">
        <ElFormItem prop="newPassword">
          <ElInput v-model="resetFormpass.newPassword" type="password" placeholder="新密码" show-password>
            <template #prefix>
              <SvgIcon name="ri:lock-2-fill" />
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="checkPassword">
          <ElInput v-model="resetFormpass.checkPassword" type="password" placeholder="确认密码" show-password>
            <template #prefix>
              <SvgIcon name="ri:lock-2-fill" />
            </template>
          </ElInput>
        </ElFormItem>
        <div class="dialog-actions">
          <ElButton type="success" plain @click="reset = false">
            取消
          </ElButton>
          <ElButton type="success" @click="handleReset">
            确认
          </ElButton>
        </div>
      </ElForm>
    </el-dialog>
    <el-dialog
      v-model="cropDialogVisible"
      title="裁剪头像"
      width="520px"
      center
      :close-on-click-modal="false"
      class="crop-dialog"
      @closed="closeCropDialog"
    >
      <div class="crop-wrap">
        <div
          ref="cropStageRef"
          class="crop-stage"
          :class="{ dragging: draggingCrop }"
          @pointerdown="handleCropPointerDown"
          @pointermove="handleCropPointerMove"
          @pointerup="handleCropPointerUp"
          @pointerleave="handleCropPointerUp"
          @wheel="handleCropWheel"
        >
          <img v-if="cropImageUrl" :src="cropImageUrl" alt="avatar-crop" class="crop-image" :style="cropImageStyle">
          <div class="crop-overlay" />
          <div class="crop-circle" />
        </div>
        <div class="crop-controls">
          <div class="control-item">
            <span>缩放（滚轮也可）</span>
            <ElSlider v-model="cropScale" :min="1" :max="3" :step="0.01" @input="onCropScaleChange" />
          </div>
          <div class="crop-tip">
            拖动图片调整位置，滚轮或滑杆调整缩放
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <ElButton type="success" plain @click="closeCropDialog">
            取消
          </ElButton>
          <ElButton type="success" class="action-btn" @click="confirmCropUpload">
            裁剪并上传
          </ElButton>
        </div>
      </template>
    </el-dialog>
  </PageMain>
</template>

<style lang="scss" scoped>
.setting-page {
  min-height: calc(100vh - 60px);
  background: #2f3136;
}

.settings-shell {
  max-width: 920px;
  margin: 0 auto;
  padding: 8px;
}

.settings-tabs {
  min-height: 720px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.panel-card {
  width: 100%;
  margin-top: 14px;
  padding: 18px 22px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #202225;
}

.panel-card h3 {
  margin: 0;
  color: #f2f3f5;
  font-size: 20px;
}

.panel-desc {
  margin: 10px 0 20px;
  color: #9aa0aa;
  font-size: 13px;
}

.basic-headline {
  position: relative;
  display: flex;
  align-items: center;
}

:deep(.avatar-uploader .el-upload) {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}

.avatar-image {
  width: 92px;
  height: 92px;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 92px;
  height: 92px;
  background: #2b2d31;
  border-radius: 14px;
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.16s ease;
}

.basic-headline:hover .avatar-mask {
  opacity: 1;
}

.input-short {
  width: 300px;
}

.input-long {
  max-width: 560px;
}

.action-btn {
  min-width: 120px;
  border-radius: 10px;
  font-weight: 600;
}

.preference-grid {
  display: grid;
  grid-template-columns: 120px 120px 1fr;
  gap: 14px;
  align-items: center;
}

.picker-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #cdd1d7;
  font-size: 12px;
}

.banner-preview {
  min-height: 52px;
  border-radius: 10px;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #181a1f;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.crop-wrap {
  display: grid;
  gap: 14px;
}

.crop-stage {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #13151a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: grab;
  touch-action: none;
}

.crop-stage.dragging {
  cursor: grabbing;
}

.crop-image {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  user-select: none;
  pointer-events: none;
}

.crop-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 0 42%, rgba(0, 0, 0, 0.48) 43%);
  pointer-events: none;
}

.crop-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 236px;
  height: 236px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.52), inset 0 0 0 1px rgba(255, 255, 255, 0.22);
  pointer-events: none;
}

.crop-controls {
  padding: 0 10px;
}

.control-item {
  color: #cdd1d7;
  font-size: 12px;
  margin-bottom: 8px;
}

.control-item span {
  display: inline-block;
  margin-bottom: 6px;
}

.crop-tip {
  margin-top: 10px;
  color: #9aa0aa;
  font-size: 12px;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__nav-wrap) {
  background: #202225;
  border-radius: 12px;
  padding: 0 8px;
}

:deep(.el-tabs__item) {
  color: #b9bbbe;
}

:deep(.el-tabs__item.is-active) {
  color: #fff;
}

:deep(.el-tabs__active-bar) {
  background: #5865f2;
}

:deep(.el-form-item__label) {
  color: #cdd1d7;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  background: #2b2d31;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}
</style>
