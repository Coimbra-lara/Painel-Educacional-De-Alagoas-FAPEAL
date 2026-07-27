import { app } from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta http://localhost:${PORT}`);
  console.log(`📚 Documentação Swagger em http://localhost:${PORT}/api-docs`);
});
