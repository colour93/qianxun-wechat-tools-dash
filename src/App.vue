<template>
  <el-container style="width: 100%">
    <el-row :gutter="20" style="width: 100%">
      <!-- 群列表 -->
      <el-col :span="12">
        <el-row class="aline">
          <p>群列表</p>
          <el-button
            @click="getGroupList"
            type="primary"
            :disabled="groupListLoading"
            >获取群列表</el-button
          >
          <!-- <el-input
            v-model="groupListSearch"
            placeholder="搜索群..."
            :prefix-icon="Search"
            style="max-width: 200px;"
          ></el-input> -->
        </el-row>
        <el-table
          :data="groupListData"
          stripe
          height="40vh"
          highlight-current-row
          @current-change="groupSelectedChange"
          v-loading="groupListLoading || addingFriend"
        >
          <!-- <el-table-column type="selection" width="30" /> -->
          <el-table-column
            prop="nick"
            label="群名称"
            :show-overflow-tooltip="true"
          />
          <el-table-column prop="memberNum" label="群员数" width="80" />
          <!-- <el-table-column prop="wxid" label="wxid" width="360" />
          <el-table-column prop="v3" label="v3" width="360" /> -->
        </el-table>
      </el-col>
      <!-- 群成员列表 -->
      <el-col :span="12">
        <el-row class="aline">
          <p>
            群成员列表 <span>{{ groupSelected }}</span>
          </p>
          <el-button
            @click="getGroupMemberListDetail"
            type="primary"
            :disabled="groupMemberListLoading"
            >获取详细信息</el-button
          >
          <el-button
            @click="addFriend"
            type="primary"
            plain
            :disabled="addingFriend"
            >添加选中用户</el-button
          >
        </el-row>

        <el-table
          ref="groupMemberListRef"
          :data="groupMemberListData"
          stripe
          height="40vh"
          v-loading="groupMemberListLoading || addingFriend"
        >
          <el-table-column type="selection" width="30" />
          <el-table-column prop="nick" label="昵称" />
          <el-table-column
            prop="wxNum"
            label="wxid（通用）"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            prop="wxid"
            label="wxid"
            :show-overflow-tooltip="true"
          />
        </el-table>
      </el-col>
      <!-- 已发送请求列表 -->
      <el-col :span="12">
        <el-row class="aline">
          <p>
            已发送请求列表 <span>{{ groupSelected }}</span>
          </p>
        </el-row>

        <el-table :data="addFriendListData" stripe height="40vh">
          <el-table-column
            prop="wxid"
            label="wxid"
            :show-overflow-tooltip="true"
          />
        </el-table>
      </el-col>
      <!-- 状态总览 -->
      <el-col :span="12">
        <p>状态总览</p>
        <el-divider content-position="left">微信账户信息</el-divider>
        <el-row>
          <el-col :span="12" class="aline">
            <el-avatar size="large" :src="profile?.avatarUrl"></el-avatar>
            <div class="acol">
              <span>{{ profile?.nick }}</span>
              <span style="font-size: small">{{ profile?.wxNum }}</span>
            </div>
          </el-col>
          <el-col :span="12" class="acol">
            <p>
              群聊总数：<span>{{ profile?.groupCount }}</span>
            </p>
            <p>
              好友总数：<span>{{ profile?.friendCount }}</span>
            </p>
          </el-col>
        </el-row>
        <el-divider content-position="left">好友请求进度</el-divider>
        <el-row>
          <el-progress
            type="dashboard"
            :percentage="
              isNaN(addedFriendCount / addFriendCount)
                ? 0
                : (addedFriendCount / addFriendCount) * 100
            "
          >
            <span>{{ addedFriendCount }} / {{ addFriendCount }}</span>
          </el-progress>
        </el-row>
      </el-col>
    </el-row>
  </el-container>
</template>

<script setup>
import { inject, ref, computed } from "vue";
import { ElNotification, ElTable, ElMessageBox } from "element-plus";
const { apiUrl, clientUrl } = inject("global");

let resp, data;

const profile = ref({});

const groupListSearch = ref("");

const groupMemberListRef = ref(ElTable);

const groupListLoading = ref(false);
const groupMemberListLoading = ref(false);
const addingFriend = ref(false);

const groupListData = ref([]);
const groupMemberListData = ref([]);
const addFriendListData = ref([]);

const groupSelected = ref("N/A");
const addedFriendCount = ref(0);
const addFriendCount = ref(0);

getOverview();

// 初始化获取总览信息
async function getOverview() {
  // 个人信息
  resp = await fetch(clientUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "Q0003",
    }),
  });
  data = await resp.json();
  profile.value = data.result;

  // 好友数
  resp = await fetch(clientUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "Q0005",
      data: {
        type: 2,
      },
    }),
  });
  // data = await resp.json();
  data = await resp.json();
  profile.value["friendCount"] = data.result.length;

  // 群数
  resp = await fetch(clientUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "Q0006",
      data: {
        type: 2,
      },
    }),
  });
  data = await resp.json();
  profile.value["groupCount"] = data.result.length;
}

// 获取群列表
async function getGroupList() {
  groupListLoading.value = true;
  resp = await fetch(clientUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "Q0006",
      data: {
        type: 2,
      },
    }),
  });
  data = await resp.json();
  groupListLoading.value = false;

  if (data.code != 200) {
    ElNotification({
      title: "获取失败",
      message: data.msg,
    });
    return;
  }

  groupListData.value = data.result;
}

// 获取群成员列表
async function getGroupMemberList(wxid) {
  // 首先获取群员列表
  groupMemberListLoading.value = true;
  resp = await fetch(clientUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "Q0008",
      data: {
        wxid,
      },
    }),
  });
  data = await resp.json();
  groupMemberListLoading.value = false;

  if (data.code != 200) {
    ElNotification({
      title: "获取失败",
      message: data.msg,
      type: "error",
    });
    return;
  }

  groupMemberListData.value = data.result;
}

// 获取群成员列表详细信息
async function getGroupMemberListDetail() {
  groupMemberListLoading.value = true;

  for (let i = 0; i < groupMemberListData.value.length; i++) {
    const memberItem = groupMemberListData.value[i];

    resp = await fetch(clientUrl, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "Q0004",
        data: {
          wxid: memberItem.wxid,
        },
      }),
    });
    data = await resp.json();

    if (data.code != 200) continue;

    groupMemberListData.value[i] = data.result;
    groupMemberListData.value[i]["wxid"] = memberItem.wxid;
  }

  groupMemberListLoading.value = false;
}

// 添加好友
async function addFriend() {
  const selectionRows = groupMemberListRef.value.getSelectionRows();
  if (selectionRows.length == 0) {
    ElNotification({
      title: "添加好友失败",
      type: "error",
      message: "请先选择至少一个账户",
    });
    return;
  }
  // 首先需要文案
  ElMessageBox.prompt("请输入好友申请文案", "提示", {
    confirmButtonText: "提交",
    cancelButtonText: "取消",
  })
    .then(async (e) => {
      addingFriend.value = true;
      addFriendCount.value = selectionRows.length;
      addedFriendCount.value = 0;

      for (let i = 0; i < selectionRows.length; i++) {
        const { wxid } = selectionRows[i];

        resp = await fetch(clientUrl, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "Q0019",
            data: {
              wxid,
              content: e.value,
              scene: 30,
            },
          }),
        });
        data = await resp.json();

        if (data.code != 200) continue;
        addedFriendCount.value++;
        addFriendListData.value.push({ wxid });

        await wait(rand(5, 20) * 1000);
      }

      ElNotification({
        title: "好友请求操作已完毕",
        type: "success",
      });
      addingFriend.value = false;
    })
    .catch(() => {
      return;
    });
}

// 群列表选择变更
async function groupSelectedChange(groupItem) {
  groupSelected.value = groupItem.nick;
  await getGroupMemberList(groupItem.wxid);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function rand(m, n) {
  return Math.ceil(Math.random() * (n - m + 1) + m - 1);
}
</script>

<style scoped>
.aline {
  display: flex;
  align-items: center;
}

.acol {
  display: flex;
  flex-direction: column;
}

.aline > *,
.acol > * {
  margin: 10px;
}
</style>