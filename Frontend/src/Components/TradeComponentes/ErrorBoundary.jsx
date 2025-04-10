import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    // Actualiza el estado para mostrar la UI alternativa.
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    // Aquí puedes registrar el error a un servicio de logging.
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI alternativa.
      return <h1>Algo salió mal.</h1>;
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
