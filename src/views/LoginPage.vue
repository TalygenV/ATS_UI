<template>
  <div class="w-100 bg-white">
         <div class="overflow-hidden p-3 acc-vh">
            <!-- start row -->
            <div class="row vh-100 w-100 g-0">
               <div class="col-lg-6 vh-100 overflow-y-auto overflow-x-hidden">
                  <!-- start row -->
                  <div class="row">
                     <div class="col-md-10 mx-auto">
                         <form @submit.prevent="handleLogin"  class=" vh-100 d-flex justify-content-between flex-column p-4 pb-0">
                           <div v-if="error" class="error-message">{{ error }}</div>
                           <div class="text-center mb-4 auth-logo">
                              <img src="../img/logo.png" class="img-fluid" alt="Logo">
                           </div>
                           <div>
                              <div class="mb-3">
                                 <h3 class="mb-2">Sign In</h3>
                              </div>
                              <div class="mb-3">
                                 <label class="form-label">Email Address</label>
                                 <div class="input-group input-group-flat">
                                    <input  id="email" v-model="email" type="email" required  placeholder="Enter your email" class="form-control"> 
                                    <span class="input-group-text">
                                    <i class="ti ti-mail"></i>
                                    </span>
                                 </div>
                              </div>
                              <div class="mb-3">
                                 <label class="form-label">Password</label>
                                 <div class="input-group input-group-flat pass-group">
                                    <input  id="password" v-model="password" type="password"  required   placeholder="Enter your password"  class="form-control"> 
                                    <span class="input-group-text toggle-password ">
                                    <i class="ti ti-eye-off"></i>
                                    </span>
                                 </div>
                              </div>
                              <div class="mb-3">
                                 <button type="submit" :disabled="loading" class="btn btn-primary w-100">
                                    <span v-if="loading">Signing in...</span>
                                    <span v-else>Sign In</span>
                                  </button>
                              </div>
                           </div>
                           <div class="text-center pb-4">
                              <p class="text-dark mb-0">
                                 Copyright &copy; 2025 - Hiring Portal | Powered By Talygen
                              </p>
                           </div>
                        </form>
                     </div>
                     <!-- end col -->
                  </div>
                  <!-- end row -->
               </div>
               <div class="col-lg-6 account-bg-01"></div>
               <!-- end col -->
            </div>
            <!-- end row -->
         </div>
      </div>


</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const { login, loading, error, hasRole } = useAuth();
    
    const email = ref('');
    const password = ref('');
    
    const handleLogin = async () => {
      const result = await login(email.value, password.value);
      if (result.success) {
        router.push('/');
      }
    };
    
    return {
      email,
      password,
      loading,
      error,
      handleLogin
    };
  }
};
</script>
