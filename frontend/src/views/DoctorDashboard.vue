<script setup>
import { connect } from "../script/app";
import { onMounted, ref } from "vue";
import { useRoute } from 'vue-router';
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const isMRVisible = ref(false);

let agentContract = ref();
let age = ref(0);
let name = ref("");
let comments = ref('');
let accessedPatientList = ref([]);
let isView = ref(false);
const options = [
    "Common Flu",
    "Viral Infection",
    "Cancer",
    "Tumor",
    "Covid-19",
    "Heart-Disorder",
    "Other"
];
let selectedOption = ref('')

const route = useRoute();
let userAccount = route.query.key;

const ipfs = create({
    host: 'localhost',
    port: '5001',
    protocol: 'http',
});

onMounted(() => {
    agentContract = connect()[0];
    getDoctor()
    getAccessedPatientList()
})

function toggleMRVisibility() {
    isMRVisible.value = !isMRVisible.value
}
async function getDoctor() {
    let result = await agentContract.methods.get_doctor(userAccount).call()
    name.value = result[0]
    age.value = result[1]
}
async function getAccessedPatientList() {
    let patientAddressList = await agentContract.methods.get_accessed_patientlist_for_doctor(userAccount).call()
    patientAddressList.forEach(async function (patientAddress) {
        let result = await agentContract.methods.get_patient(patientAddress).call()
        result.address = patientAddress
        accessedPatientList.value.push(result)
    })
    console.log(accessedPatientList.value)
}
function toggleActionVisibility() {
    isView.value = !isView.value
}
function getDateTime() {
    function AddZero(num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    }
    var now = new Date();
    var strDateTime = [[AddZero(now.getDate()),
    AddZero(now.getMonth() + 1),
    now.getFullYear()].join("/"),
    [AddZero(now.getHours()),
    AddZero(now.getMinutes())].join(":"),
    now.getHours() >= 12 ? "PM" : "AM"].join(" ");
    return strDateTime;
}
async function submitDiagnosis(diagnosis, patientAddress) {
    let patient = accessedPatientList.value.filter(patient => patient.address == patientAddress)
    let newRecords = `Diagnosed By : ${name.value}
Diagnosis Time : ${getDateTime()}
Diagnosis : ${diagnosis}
Comments : ${comments.value}

        
`
    let updatedRecords = patient[4] + newRecords
    let buffer = Buffer.from(updatedRecords);

    const result = await ipfs.add(buffer);
    let ipfshash = result.path
    await agentContract.methods
        .insurance_claim(patientAddress, options.indexOf(diagnosis), ipfshash)
        .send({ from: userAccount, gas: 1000000 })
        .on("receipt", (receipt) => {
            console.log("Transaction successful! Receipt:", receipt);
            alert("Your diagnosis has been submitted.");
            accessedPatientList.value = accessedPatientList.value.filter(patient => patient.address != patientAddress)
        })
}
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
                <p class="mt-2">Umur : {{ age }}</p>
            </div>
            <div class="ml-10 flex-1 cursor-pointer">
                <div @click="toggleMRVisibility" class="px-5 py-6 rounded-lg flex justify-between bg-[#DEE9DD]">
                    <div>REKAM MEDIS PASIEN</div>
                    <img src="../assets/arrow_down.svg"
                        :class="['transform transition duration-300 ease-in-out', isMRVisible ? 'rotate-180' : '']">
                </div>
                <div class="px-5 mt-5 mb-10 py-6 rounded-lg bg-[#DEE9DD]" v-if="isMRVisible">
                    <table class="w-full text-left rtl:text-right">
                        <thead>
                            <tr>
                                <th>Nama Pasien</th>
                                <th>Kunci Publik</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody v-for="(item, index) in accessedPatientList" :key="index" :value="item">
                            <tr>
                                <td>{{ item[0] }}</td>
                                <td>{{ item.address }}</td>
                                <td>
                                    <button @click="toggleActionVisibility"
                                        :class="['rounded-lg px-5 py-1 text-white', isView ? 'bg-red-500' : 'bg-green-500']">
                                        {{ isView ? 'Sembunyikan' : 'Lihat' }}
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="isView">
                                <td class="pb-3"></td>
                            </tr>
                            <tr v-if="isView">
                                <td colspan="3" class="px-5 py-5 rounded-lg bg-[#ACBFAA]">
                                    <div>Masukkan diagnosis baru</div>
                                    <select class="rounded-lg py-1 mt-2 w-[30rem] pl-3" v-model="selectedOption">
                                        <option v-for="(item, index) in options" :key="index" :value="item">
                                            {{ item }}
                                        </option>
                                    </select>
                                    <textarea v-model="comments" class="block rounded-lg pl-2 w-[30rem] pt-2 mt-3"
                                        rows="5" placeholder="Detail diagnosis"></textarea>
                                    <button @click="submitDiagnosis(selectedOption, item.address)"
                                        class="bg-blue-900 text-white px-3 py-2 mt-3 rounded-lg"> Submit</button>
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