<script setup>
import { ref, onMounted } from "vue";
import { connect } from "../script/app";
import { useRouter } from 'vue-router';
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const router = useRouter();
const name = ref("");
const age = ref(0);
const designation = ref("");
let agentContract = ref();
let userAccount = ref();
let contractAccount = ref([])

onMounted(() => {
    contractAccount = connect();
    agentContract = contractAccount[0]
    userAccount = contractAccount[1]
});

async function addAgent() {
    const ipfs = create({
        host: 'localhost',
        port: '5001',
        protocol: 'http',
    });

    let designationNumber = designation.value == "pasien" ? 0 : 1

    let publicKey = window.ethereum.selectedAddress;
    publicKey = publicKey.toLowerCase();
    console.log("PK:" + publicKey);

    var validPublicKey = true;
    var validAgent = true;
    var PatientList = 0;
    var DoctorList = 0;
    let InsurerList = 0;

    try {
        PatientList = await agentContract.methods.get_patient_list().send({ from: userAccount });
    } catch (error) {
        console.error(error);
    }

    try {
        DoctorList = await agentContract.methods.get_doctor_list().call({ from: userAccount });
    } catch (error) {
        console.error(error);
    }

    try {
        // InsurerList = agentContract.methods.get_insurer_list().call({ from: userAccount });
    } catch (error) {
        console.error(error);
    }


    if (validPublicKey == false) {
        // $(".alert-warning").show();
    }
    else {
        for (let j = 0; j < PatientList.length; j++) {
            if (publicKey == PatientList[j]) {
                validAgent = false;
            }
        }
        for (let j = 0; j < DoctorList.length; j++) {
            if (publicKey == DoctorList[j]) {
                validAgent = false;
            }
        }
        for (let j = 0; j < InsurerList.length; j++) {
            if (publicKey == InsurerList[j]) {
                validAgent = false;
            }
        }
        console.log(validAgent);
        if (validAgent == true) {
            var ipfshash = "";

            if (designationNumber == 0) {
                var reportTitle = `Name: ${name} Public Key: ${publicKey}`;
                var buffer = Buffer.from(reportTitle);
                ipfs.add(buffer)
                    .then((result) => {
                        ipfshash = result.path
                        console.log("Ipfs hash:" + ipfshash);
                    }).catch((error) => {
                        console.error('IPFS Error:', error);
                    })
                agentContract.methods.add_agent(name.value, age.value, designationNumber, ipfshash).send({ from: userAccount })
                    .on('receipt', (receipt) => {
                        console.log('Transaction Receipt:', receipt);
                        router.push('/patient/dashboard');
                    })
                    .on('error', (error) => {
                        console.error('Transaction Error:', error)
                    })
            } else {
                try {
                    agentContract.methods.add_agent(name.value, age.value, designationNumber, ipfshash).send({ from: userAccount });
                    if (designationNumber == 1) {
                        router.push('/doctor/dashboard');
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }
        else {
            // $(".alert-info").show();
        }

    }

    return false;
}
</script>

<template>
    <div class="font-alata mt-5 flex flex-col items-center">
        <img src="../assets/logo.png" width="100">
        <h1 class="text-2xl mt-3 w-52 text-center text-white">Sistem Manajemen Rekam Medis</h1>
        <div class="my-10 text-lg rounded-lg text-[#1A4565] bg-[#AFC6C3] px-5 py-8">
            <div class="mb-2">Nama Lengkap</div>
            <input type="text" v-model="name" class="rounded-lg w-[30rem] py-1 pl-3" required />
            <div class="mb-2 mt-5">Umur</div>
            <input type="number" v-model="age" class="rounded-lg w-[30rem] py-1 pl-3" required />
            <div class="mb-2 mt-5">Mendaftar sebagai</div>
            <select class="rounded-lg w-[30rem] py-1 pl-3" v-model="designation">
                <option value="pasien">Pasien</option>
                <option value="dokter">Dokter</option>
            </select>
            <div class="flex justify-center">
                <button @click="addAgent"
                    class="block bg-[#1A4565] px-7 py-3 mt-10 text-xl text-white rounded-lg">DAFTAR</button>
            </div>
        </div>
    </div>
</template>

<style>
body {
    background: linear-gradient(to right, #0D6A8B, #194665);
}
</style>