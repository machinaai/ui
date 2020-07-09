export const BackToHomeAction = {
  title: {
    "es-ES": "Regresar a Home",
    "en-US": "Back To Home"
  },
  browserHandler: "BACK_TO_HOME"
};

export const InstallDependencyAction = {
  title: {
    "es-ES": "Instalar Dependencias",
    "en-US": "Install Dependencies"
  },
  handler: {
    type: "@@actions/installDependencies",
    payload: {
      npmClient: true,
      projectPath: true
    }
  }
};

export const ReInstallDependencyAction = {
  title: {
    "es-ES": "Reinstalar Dependencias",
    "en-US": "Reinstall Dependencies"
  },
  handler: {
    type: "@@actions/reInstallDependencies",
    payload: {
      npmClient: true,
      projectPath: true
    }
  }
};

export const OpenConfigFileAction = {
  title: {
    "es-ES": "Abrir archivo de configuración",
    "en-US": "Open Configuration File"
  },
  handler: {
    type: "@@actions/openConfigFile",
    payload: {
      projectPath: true
    }
  }
};

export const OpenProjectAction = {
  title: {
    "es-ES": "Abrir Proyecto en Editor",
    "en-US": "Open Project In Editor"
  },
  handler: {
    type: "@@actions/openProjectInEditor",
    payload: {
      projectPath: true
    }
  }
};
