export default [
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
    component: 'test',
  },
];
