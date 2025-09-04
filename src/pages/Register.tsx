import { Helmet } from "react-helmet-async";
import UserRegistrationForm from "@/components/UserRegistrationForm";

export default function Register() {
  return (
    <>
      <Helmet>
        <title>Criar Conta - Cadastro de Usuário</title>
        <meta 
          name="description" 
          content="Crie sua conta na plataforma. Cadastro rápido e seguro com integração MOTV completa." 
        />
        <meta name="keywords" content="cadastro, registro, conta, usuário, MOTV" />
      </Helmet>
      
      <main className="min-h-screen">
        <UserRegistrationForm />
      </main>
    </>
  );
}