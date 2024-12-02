<script setup>
import { onMounted, ref } from "vue";
import { connect } from "../script/app";
import { useRoute } from 'vue-router';
import Web3 from "web3";
import axios from "axios";

const isSMRVisible = ref(false);
const isMRVisible = ref(false);
const isCAMRVisible = ref(false);

function toggleSMRVisibility() {
    isSMRVisible.value = !isSMRVisible.value
}
function toggleCAMRVisibility() {
    isCAMRVisible.value = !isCAMRVisible.value
}
function toggleMRVisibility() {
    isMRVisible.value = !isMRVisible.value
}

let agentContract = ref();
let contractAccount = ref([])
let doctorList = ref([]);
let age = ref(0);
let name = ref("");
let ailments = ref([]);
let insurerAddress = ref("");
let recordHash = ref('');
let recordData = ref('');
let options = ref([]);
let accessedDoctorAddressList = ref([]);
let accessedDoctorList = ref([]);
let selectedIndex = ref(0);

const route = useRoute();
let userAccount = route.query.key;

async function getPatientDetails() {
    const result = await agentContract.methods.get_patient(userAccount).call()
    name.value = result[0]
    age.value = result[1]
    ailments.value = result[2];
    insurerAddress.value = result[3];
    recordHash.value = result[4];

    getRecords();
}
async function getRecords() {
    const response = await axios.get(`http://localhost:8080/ipfs/${recordHash.value}`);
    recordData.value = response.data;
}
async function getDoctorList() {
    doctorList = await agentContract.methods.get_doctor_list().call()
    for (let i = 0; i < doctorList.length; i++) {
        let result = await agentContract.methods.get_doctor(doctorList[i]).call()
        options.value.push(result);
    }
}
async function getAccessedDoctorList() {
    accessedDoctorAddressList = await agentContract.methods.get_accessed_doctorlist_for_patient(userAccount).call()
    for (const [_, doctorAddress] of Object.entries(accessedDoctorAddressList)) {
        let result = await agentContract.methods.get_doctor(doctorAddress).call()
        result.address = doctorAddress
        accessedDoctorList.value.push(result)
    }
}
async function giveAccess() {
    console.log(doctorList)
    let doctorAddress = doctorList[selectedIndex]
    let web3 = new Web3(window.ethereum)
    await agentContract.methods.permit_access(doctorAddress).send({
        from: userAccount,
        value: web3.utils.toWei('2', 'ether') // Convert 2 ether to wei
    });
    let doctorToBeAdded = options.value[selectedIndex]
    doctorToBeAdded.address = doctorAddress
    accessedDoctorList.value.push(options.value[selectedIndex])
}
function getSelectedIndex(event) {
    selectedIndex = event.target.selectedIndex
}
async function revokeAccess(doctorAddress) {
    let web3 = new Web3(window.ethereum)
    await agentContract.methods.revoke_access(doctorAddress).send({
        from: userAccount, // The caller's address
        value: web3.utils.toWei('2', 'ether'), // Send 2 ether
    })
    accessedDoctorList.value = accessedDoctorList.value.filter(item => item.address != doctorAddress)
    accessedDoctorAddressList.value = accessedDoctorAddressList.value.filter(item => item != doctorAddress)
}

onMounted(() => {
    agentContract = connect()[0];

    getPatientDetails();
    getDoctorList();
    getAccessedDoctorList();
})

</script>

<template>
    <div class="font-alata">
        <header class="py-4 px-5 flex justify-between">
            <div class="flex items-center">
                <img src="../assets/logo.png" width="70">
                <h1 class="ml-5 text-2xl text-white">Sistem Manajemen Rekam Medis</h1>
            </div>
            <button class="bg-red-500 rounded-lg px-5 my-2 text-white">
                LOG OUT
            </button>
        </header>
        <div class="flex mt-10 px-10">
            <div class="bg-[#DEE9DD] rounded-lg flex-3 py-12 h-72 px-20">
                <div class="flex justify-center">
                    <img src="../assets/user.png" width="100">
                </div>
                <p class="mt-5">Nama: {{ name }}</p>
                <p class="mt-2">Umur: {{ age }} tahun</p>
            </div>
            <div class="ml-10 flex-1 cursor-pointer">
                <div @click="toggleMRVisibility" class="px-5 py-6 rounded-lg flex justify-between bg-[#DEE9DD]">
                    <div>REKAM MEDIS</div>
                    <img src="../assets/arrow_down.svg"
                        :class="['transform transition duration-300 ease-in-out', isMRVisible ? 'rotate-180' : '']">
                </div>
                <div class="px-5 items-center mt-5 py-6 rounded-lg bg-[#DEE9DD]" v-if="isMRVisible">
                    <div>{{ recordData }}</div>
                </div>
                <div @click="toggleSMRVisibility" class="px-5 mt-5 py-6 rounded-lg flex justify-between bg-[#DEE9DD]">
                    <div>BAGIKAN REKAM MEDIS</div>
                    <img src="../assets/arrow_down.svg"
                        :class="['transform transition duration-300 ease-in-out', isSMRVisible ? 'rotate-180' : '']">
                </div>
                <div class="px-5 items-center mt-5 py-6 rounded-lg bg-[#DEE9DD]" v-if="isSMRVisible">
                    <div class="flex">
                        <div>Dokter: </div>
                        <select @change="getSelectedIndex" class="ml-10 rounded-lg w-[30rem] py-1 pl-3"
                            v-model="doctor">
                            <option v-for="(item, index) in options" :key="index" :value="item">
                                {{ item[0] }}
                            </option>
                        </select>
                    </div>
                    <div class="flex justify-center mt-5">
                        <button @click="giveAccess" class="bg-blue-950 rounded-lg px-10 py-2 text-white">Submit</button>
                    </div>
                </div>
                <div @click="toggleCAMRVisibility" class="px-5 mt-6 py-6 rounded-lg flex justify-between bg-[#DEE9DD]">
                    <div>KONTROL AKSES REKAM MEDIS</div>
                    <img src="../assets/arrow_down.svg"
                        :class="['transform transition duration-300 ease-in-out', isCAMRVisible ? 'rotate-180' : '']">
                </div>
                <div class="px-5 mt-5 py-6 rounded-lg bg-[#DEE9DD]" v-if="isCAMRVisible">
                    <table class="w-full text-left rtl:text-right">
                        <thead>
                            <tr>
                                <th>Nama Dokter</th>
                                <th>Kunci Publik</th>
                                <th>Hapus Akses</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in accessedDoctorList" :key="index" :value="item">
                                <td>{{ item[0] }}</td>
                                <td>{{ item.address }}</td>
                                <td>
                                    <button @click="revokeAccess(item.address)"
                                        class="bg-red-500 rounded-lg px-5 py-1 text-white">
                                        Hapus Akses
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
header {
    background: linear-gradient(to right, #0D6A8B, #194665);
}
</style>