<script setup>
import { connect } from "../script/app";
import { onMounted, ref } from "vue";
import { useRouter } from 'vue-router';

const router = useRouter(); // Get access to the router

function goToRegister() {
  router.push('/register');
}
function goToPatientDashboard() {
  router.push('/patient/dashboard');
}

const isVisible = ref(false);
let agentContract = ref();
let publicKey = ref('')
let contractAccount = ref([]);

onMounted(() => {
  contractAccount = connect();
  agentContract = contractAccount[0];
  publicKey = contractAccount[1];
});

async function login() {
  // Call the get_patient_list method (replace with actual method name and arguments)
  const PatientList = await agentContract.methods.get_patient_list().call();
  const DoctorList =await agentContract.methods.get_doctor_list().call();
  for (let i = 0; i < PatientList.length; i++) {
    // Compare the public key (ensuring case-insensitive comparison)
    if (publicKey.toLowerCase() == PatientList[i].toLowerCase()) {
      // Redirect to patient page if match is found
      router.push(`/patient/dashboard?key=${publicKey}`)
      return;
    }
  }
  for (let i = 0; i < DoctorList.length; i++) {
    // Compare the public key (ensuring case-insensitive comparison)
    if (publicKey.toLowerCase() == DoctorList[i].toLowerCase()) {
      // Redirect to patient page if match is found
      router.push(`/doctor/dashboard?key=${publicKey}`)
      return;
    }
  }

  console.log("Invalid User!");
  isVisible.value = !isVisible.value;
}

</script>

<template>
  <div class="font-alata bg-gradient-to-r h-lvh from-[#0D6A8B] to-[#194665] pt-5 flex flex-col items-center">
    <img src="../assets/logo.png" width="100">
    <h1 class="text-2xl mt-3 w-52 text-center text-white">Sistem Manajemen Rekam Medis</h1>
    <div class="mt-10 rounded-lg flex flex-col items-center bg-[#AFC6C3] px-32 py-16">
      <p class="text-[#1A4565]">Login terhubung langsung ke akun Metamask anda</p>
      <button @click="login" class="bg-[#1A4565] px-7 py-3 mt-5 text-xl text-white rounded-lg">LOGIN</button>
    </div>
    <div class="text-red-500 mt-5" v-if="isVisible">
      Anda belum mempunyai akun
    </div>
    <div class="flex items-center mt-5">
      <p class="text-white mr-5 text-lg">Belum punya akun?</p>
      <button @click="goToRegister" class="bg-green-600 px-7 py-3 text-xl text-white rounded-lg">BUAT AKUN</button>
    </div>
  </div>
</template>
