<script setup lang="ts" xmlns="">
import {ElAvatar, ElBadge, ElRow, FormInstance, FormRules} from "element-plus";
import {ElCol} from "element-plus";
import {ElButton} from "element-plus";
// import{Share} from "@element-plus/icons";
import {ElIcon} from "element-plus";
import {ElText} from "element-plus";
import {ElDivider} from "element-plus";
import {ElEmpty} from "element-plus";
import {ElLoading} from "element-plus";
import {ElInput} from "element-plus";
import {ElForm} from "element-plus";
// const uname = ref('')
import {ElFormItem} from "element-plus";
// const uname = ref('')
</script>
<template>
<div>
<PageMain  style="height: 100vh">
  <template #title>
    <div style="width: 50%">
   <el-row justify="start">
     <el-col :span="4">
       <el-row justify="start">
         <el-col :span="6">
           <SvgIcon :size="24" name="mdi:human-hello" />
         </el-col>
         <el-col :span="18">
           <el-text size="large">
             <strong>好友</strong></el-text>
         </el-col>
       </el-row>
     </el-col>
     <el-col :span="4">
      <el-button type="default" text @click="changeMenu(0)" >在线</el-button>
     </el-col>
     <el-col :span="4">
       <el-button type="default" text @click="changeMenu(1)" >全部</el-button>
     </el-col>
     <el-col :span="4">
       <el-button type="default" text @click="changeMenu(2)">待定</el-button>
     </el-col>
     <el-col :span="4">
       <el-button type="default" text @click="changeMenu(3)">已屏蔽</el-button>
     </el-col>
     <el-col :span="4">
       <el-button type="success" plain @click="changeMenu(4)">添加好友</el-button>
     </el-col>
   </el-row>
    </div>
  </template>
  <template #default>
    <div class="" style="display: flex;height: 90vh">
    <div class="content" style="flex:2">
        <div class="online"  v-if="menu[0]">
            <el-empty description="暂无在线好友" v-if="onlineFriendDisplay.length==0"/>
          <el-scrollbar wrap-class="scrollbar-wrapper" view-class="scrollbar-view" wrap-style="height: 80vh">
          <div v-for="(item,index) in onlineFriendDisplay" :key="index" class="m-5" >
            <el-row justify="start" align="middle">
              <el-col :span="2">
                <el-badge is-dot class="item" :type="item.online ? 'success' : 'info'" style="margin-left: 10px;">
                  <el-avatar :src="item.avatar" :size="36" shape="circle"/>
                </el-badge>
              </el-col>
              <el-col :span="4">
                <el-text size="large">
                  <strong>{{item.unick}}</strong></el-text><br>
                <el-text type="info">{{item.uname}}</el-text>
              </el-col>
              <el-col :span="15"></el-col>
              <div style="display: flex" >
                <el-space>
                <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="发送私信"
                  >
                        <el-button text circle >
                    <SvgIcon name="mdi:message" />
                  </el-button>
                  </el-tooltip>
                </span>
                <span style="flex:1">
                   <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="删除好友"
                  >
                        <el-button text circle @click="deleteFriend(parseInt(item.uid))" >
                    <SvgIcon name="fluent:person-delete-20-filled"></SvgIcon>
                  </el-button>
                  </el-tooltip>
                </span>
                </span>
                </el-space>
              </div>
            </el-row>
          </div>
          </el-scrollbar>
        </div>
        <div class="all"  v-if="menu[1]">
            <el-empty description="当前还没有好友" v-if="friends.length==0">
                <el-button type="success" size="large" @click="changeMenu(4)">添加好友</el-button>
            </el-empty>
          <el-scrollbar wrap-class="scrollbar-wrapper" view-class="scrollbar-view" wrap-style="height: 80vh">
            <el-input
                clearable placeholder="输入用户名搜索" class="m-5" style="width:80%;height: 45px;background: #1F1F21" v-model="input[1]"></el-input>
            <br>
            <el-text type="info" class="m-5">
              <strong>好友数&nbsp;:&nbsp;</strong>
              <span style="font-family:'Times New Roman';font-size: large;">
                <strong>   {{allFriendDisplay.length}}</strong>
             </span>
            </el-text>
            <el-divider direction="horizontal" class="m-5"></el-divider>
            <div v-for="(item,index) in allFriendDisplay" :key="index" class="m-5">
              <el-row justify="start" align="middle">
                <el-col :span="2">
                  <el-badge is-dot class="item" :type="item.online ? 'success' : 'info'" style="margin-left: 10px;">
                    <el-avatar :src="item.avatar" :size="36" shape="circle"/>
                  </el-badge>
                </el-col>
                <el-col :span="4">
                  <el-text size="large">
                    <strong>{{item.unick}}</strong></el-text><br>
                  <el-text type="info">{{item.uname}}</el-text>
                </el-col>
                <el-col :span="15"></el-col>
                <div style="display: flex" >
                  <el-space>
                <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="发送私信"
                  >
                        <el-button text circle @click="activateWindow(item.uname)">
                    <SvgIcon name="mdi:message" />
                  </el-button>
                  </el-tooltip>
                </span>
                    <span style="flex:1">
                   <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="删除好友"
                  >
                        <el-button text circle @click="deleteFriend(parseInt(item.uid))" >
                    <SvgIcon name="fluent:person-delete-20-filled"></SvgIcon>
                  </el-button>
                  </el-tooltip>
                </span>
                </span>
                  </el-space>
                </div>
              </el-row>
            </div>
          </el-scrollbar>
        </div>
        <div class="online"  v-if="menu[2]">
            <el-empty description="暂无待处理的事项..." v-if="friendsReq.length==0"/>
          <el-scrollbar wrap-class="scrollbar-wrapper" view-class="scrollbar-view" v-if="friendsReq.filter((item)=>{return item.from == 1}).length>0">
<!--            <el-input-->
<!--                clearable placeholder="输入用户名搜索" class="m-5" style="width:80%;height: 45px;background: #1F1F21" v-model="input[1]"></el-input>-->
<!--            <br>-->
            <el-text type="info" class="m-5">
              <strong>送出的&nbsp;:&nbsp;</strong>
              <span style="font-family:'Times New Roman';font-size: large;">
                <strong>   {{friendsReq.filter((item)=>{return item.from == 1}).length}}</strong>
             </span>
            </el-text>
            <el-divider direction="horizontal" class="m-5"></el-divider>
            <div v-for="(item,index) in friendsReq.filter((item)=>{return item.from == 1})" :key="index" class="m-5">
              <el-row justify="start" align="middle">
                <el-col :span="2">
<!--                  <el-badge is-dot class="item" :type="item.online ? 'success' : 'info'" style="margin-left: 10px;">-->
                    <el-avatar :src="item.avatar" :size="48" shape="circle"/>
<!--                  </el-badge>-->
                </el-col>
                <el-col :span="4">
                  <el-text size="large">
                    <strong>{{item.unick}}</strong></el-text><br>
                  <el-text type="info">送出的好友请求</el-text>
<!--                  <el-text type="info" v-else >接收到的好友请求</el-text>-->
                </el-col>
                <el-col :span="15"></el-col>
                <div style="display: flex">
                  <el-space>
                <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="撤回请求"
                  >
                        <el-button text circle >
                    <SvgIcon name="fluent-emoji-high-contrast:cross-mark" />
                  </el-button>
                  </el-tooltip>
                </span>
                    <span style="flex:1">
                   <span style="flex: 1;">
<!--                  <el-tooltip-->
<!--                      placement="top"-->
<!--                      effect="light"-->
<!--                      content="拒绝请求"-->
<!--                  >-->
<!--                        <el-button text circle @click="" >-->
<!--                    <SvgIcon name="fluent-emoji-high-contrast:cross-mark"></SvgIcon>-->
<!--                  </el-button>-->
<!--                  </el-tooltip>-->
                </span>
                </span>
                  </el-space>
                </div>
              </el-row>
            </div>
          </el-scrollbar>
          <el-scrollbar wrap-class="scrollbar-wrapper" view-class="scrollbar-view" v-if="friendsReq.filter((item)=>{return item.from == 0}).length>0">
            <!--            <el-input-->
            <!--                clearable placeholder="输入用户名搜索" class="m-5" style="width:80%;height: 45px;background: #1F1F21" v-model="input[1]"></el-input>-->
            <!--            <br>-->
            <el-text type="info" class="m-5">
              <strong>接收到的&nbsp;:&nbsp;</strong>
              <span style="font-family:'Times New Roman';font-size: large;">
                <strong>   {{friendsReq.filter((item)=>{return item.from == 0}).length}}</strong>
             </span>
            </el-text>
            <el-divider direction="horizontal" class="m-5"></el-divider>
            <div v-for="(item,index) in friendsReq.filter((item)=>{return item.from == 0})" :key="index" class="m-5">
              <el-row justify="start" align="middle">
                <el-col :span="2">
                  <!--                  <el-badge is-dot class="item" :type="item.online ? 'success' : 'info'" style="margin-left: 10px;">-->
                  <el-avatar :src="item.avatar" :size="48" shape="circle"/>
                  <!--                  </el-badge>-->
                </el-col>
                <el-col :span="4">
                  <el-text size="large">
                    <strong>{{item.unick}}</strong></el-text><br>
<!--                  <el-text type="info" v-if="frie.from==1">送出的好友请求</el-text>-->
                  <el-text type="info" >接收到的好友请求</el-text>
                </el-col>
                <el-col :span="15"></el-col>
                <div style="display: flex"  v-if="item.from==0">
                  <el-space>
                <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="接受请求"
                  >
                        <el-button text circle  @click="acceptFriendReq(item.uname)">
                    <SvgIcon name="fluent-emoji-high-contrast:check-mark" />
                  </el-button>
                  </el-tooltip>
                </span>
                    <span style="flex:1">
                   <span style="flex: 1;">
                  <el-tooltip
                      placement="top"
                      effect="light"
                      content="拒绝请求"
                  >
                        <el-button text circle @click="" >
                    <SvgIcon name="fluent-emoji-high-contrast:cross-mark"></SvgIcon>
                  </el-button>
                  </el-tooltip>
                </span>
                </span>
                  </el-space>
                </div>
              </el-row>
            </div>
          </el-scrollbar>
        </div>
        <div class="online"  v-if="menu[3]">
            <el-empty description="小黑屋里什么也没有..."/>
        </div>
        <div class="online"  v-if="menu[4]"  >
            <el-text size="large">
                <strong>添加好友</strong></el-text><br><br>
<!--            <el-text type="info">你可以采用LeetChat用户名添加好友</el-text><br><br>-->
            <el-form  ref="unameForm" :v-model="unameForm">
                <el-form-item prop="uname">
                    <el-input
                        clearable placeholder="输入用户名添加好友" style="width: 40%;height: 40px;background: #1F1F21" v-model="input[4]"></el-input>
<!--                <el-input placeholder="你可以采用LeetChat用户名添加好友" style="width: 40%;height: 40px" v-model="uname"></el-input>-->
                  <el-divider direction="vertical" border-style=2></el-divider>
                  <el-button type="warning" plain size="large" :disabled="show" id="search"
                  @click="postFriendReq()"
                  >发送好友请求</el-button>
                </el-form-item>

                <el-divider></el-divider>
            </el-form>
<!--            <el-empty description="当前还没有好友"/>-->

        </div>
    </div>
      <el-divider direction="vertical" style="height: 80vh"></el-divider>
      <div class="activity" style="flex:1;">
        <el-text class="m-5 mt-10" style="font-size: 18px">
          <strong>当前活动</strong></el-text><br><br>
      </div>

    </div>
  </template>
</PageMain>
</div>
</template>
<script lang="ts">
import {ElMessage} from "element-plus";
// import api from "@/api";
import apiFriend from "../../api/modules/friend.ts";
import apiMessage from "../../api/modules/message.ts";
export default {
  data(){
    return{
      menu:[true,false,false,false,false],
        loading:false,
      input:['','','','',''],
       unameForm:{
            uname:'',
       },
        show:true,
      fname:'',
      friends:[{
        uname:'',
        uid:'',
        unick:'',
        online:1,
        avatar:'',
      }],
      allFriendDisplay:[{
        uname:'',
        uid:'',
        unick:'',
        online:1,
        avatar:'',
      }],
      onlineFriendDisplay:[{
        uname:'',
        uid:'',
        unick:'',
        online:1,
        avatar:'',
      }],
      friendsReq:[
          {
        uname:'',
        uid:'',
        unick:'',
        avatar:'',
        status:'',
      }
      ],
    }
  },
  mounted(){
    this.loadFriends()
  },
    methods:{
    activateWindow(
        uname:string
    ){
      apiMessage.activateWindow(
     uname
      ).then((res)=>{
        console.log(res)
        this.$router.push('/MailBox');
      }).catch((err)=>{
        console.log(err)
      })
      //路由切换
    },
      getFriendRequest(){
      apiFriend.getFriendRequest().then((res)=>{
        this.friendsReq = res.data
        console.log(this.friendsReq)
      })
    },
    deleteFriend(uid:number){
      // 此操作将删除好友是否继续


      this.$confirm('此操作将删除好友是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // this.friends.findIndex((item, index) => {
        //   if (item.uid === uid) {
        //     this.friends.splice(index, 1);
        //     return true; // 停止查找，找到并删除元素后返回true
        //   }
        //   return false; // 继续查找
        // })
        const index = this.friends.findIndex(item => item.uid === uid);
        if (index !== -1) {
          this.friends.splice(index, 1);
        }
        console.log(this.friends)
        this.$message({
          type: 'success',
          message: '删除成功!'+index+'  '+this.friends[index].uname

        });
        this.updateView()
        // this.deleteFriendApi(uid)

      }).catch((err) => {
        console.log(err)
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    async loadFriends(){
      let res = await apiFriend.getFriendList()
      this.friends = res.data
      this.updateView()

    },
      updateView(){
        this.onlineFriendDisplay = this.friends.filter((item)=>{
          return item.online == 1
        })
        this.allFriendDisplay = this.friends
      }
      ,
    postFriendReq() {
      document.getElementById('search')?.blur()
      // ElMessage.success(this.unameForm.uname)
      apiFriend.sendRequest(this.input[4]).then((res)=>{
        if(res.code==0)
        {
          ElMessage.success("好友请求发送成功!")
        }else {
          ElMessage({
            message: res.description,
            type: 'error'
          })
        }
        this.input[4]=''
      })
      // ElMessage.success("好友请求发送成功!")

      // this.loading = true

    },resetInput(index:number){
        for(let i=0;i<this.input.length;i++){
          if(i!=index)
            this.input[i]=''
        }
        // this.input[index]=''
      },
      changeMenu(index:number){
          const loading = ElLoading.service({fullscreen:false, target : document.querySelector('.content') as any,text:'加载中...'})
        this.getFriendRequest()
        setTimeout(() => {
              loading.close()
              for(let i=0;i<this.menu.length;i++){
                  this.menu[i]=false
              }
              this.menu[index]=true
          this.resetInput(index)
          }, 100);
      },
      acceptFriendReq(uname:string){
        apiFriend.acceptFriendReq(uname).then((res)=>{
          if(res.code==0)
          {
            ElMessage.success("已成功添加好友")
          }else {
            ElMessage({
              message: res.description,
              type: 'error'
            })
          }
        })
      },
      rejectFriendReq(uid:number){
        apiFriend.rejectFriendReq(uid).then((res)=>{
          if(res.code==0)
          {
            ElMessage.success("已拒绝好友请求")
          }else {
            ElMessage({
              message: res.description,
              type: 'error'
            })
          }
        })
      },
      drawbackFriendReq(uid:number){
        apiFriend.drawbackFriendReq(uid).then((res)=>{
          if(res.code==0)
          {
            ElMessage.success("好友请求发送成功!")
          }else {
            ElMessage({
              message: res.description,
              type: 'error'
            })
          }
        })
      }
    },
    watch:{
      "input.4"(val:string,oldVal:string){
        this.show = val.length <= 0;
      },
      "input.1"(val:string,oldVal:string){
        this.allFriendDisplay = this.friends.filter((item)=>{
          return item.uname.indexOf(val) > -1
        })
      }
    }

}
</script>
<style scoped lang="scss">

</style>
