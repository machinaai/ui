exports.plugins = [];
exports.routes = [
  {
    path: '/aa',
    component: 'aa',
    routes: [
      {
        path: '/aa/vv',
        name: 'dd',
        component: 'adad', 
      },
      {
        path: '/aa/xx',
        name: 'xx',
        component: 'xx',
        routes: [
          {
            path: '/aa/xx/sdad',
            
            name: 'aada',
            component: 'xxx',
            routes: [
              {
                name: 'hehe',
                path: 'xxxcc',
              },
              {
                path: '/aa/xx/sdad/demo',
                component: './aa/xx/sdad/Demo',
              },
            ],
          },
          {
            path: 'aa',
            name: 'aadsda',
            component: 'xxxc',
          },
        ],
      },
    ],
  },
  {
    path: '/bb',
    component: 'bb',
  },
  {
    path: '/',
    component: '../MainLayout',
    childRoutes: [
      {
        path: 'test1',
        component: './test1',
      },
    ],
  },
];
