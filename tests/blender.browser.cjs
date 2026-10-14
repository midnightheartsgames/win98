/* Run with BLENDER_PLAYWRIGHT pointing to an installed Playwright package. */
const {chromium}=require(process.env.BLENDER_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto('http://localhost:8080/');
    await page.locator('#boot-screen').waitFor({state:'hidden'});
    await page.evaluate(()=>{if(window.gameManager&&!window.gameManager.isInstalled('blender'))window.gameManager.finishInstallation('blender');});
    await page.locator('.desktop-icon[data-id="blender"]').dblclick();
    await page.locator('#app_blender .blender-viewport').waitFor();
    const state=()=>page.evaluate(()=>({objects:appBlender.model.objects.length,edit:appBlender.model.edit,loc:appBlender.model.active.loc,vertices:appBlender.model.active.mesh?.vertices.length,selected:[...appBlender.model.active.selected],modal:!!appBlender.ui.modal.state,cursor:appBlender.model.cursor}));
    const box=await page.locator('.blender-viewport').boundingBox();
    assert.ok(box.height>200);const cx=box.x+box.width/2,cy=box.y+box.height/2;
    const basis=()=>page.evaluate(()=>({right:appBlender.ui.view.right,target:appBlender.ui.view.target,zoom:appBlender.ui.view.zoom}));
    const initial=await basis();await page.mouse.move(cx,cy);await page.mouse.down({button:'middle'});await page.mouse.move(cx+25,cy+10);await page.mouse.up({button:'middle'});assert.notDeepEqual((await basis()).right,initial.right);
    await page.keyboard.down('Shift');await page.mouse.down({button:'middle'});await page.mouse.move(cx+40,cy+30);await page.mouse.up({button:'middle'});await page.keyboard.up('Shift');assert.notDeepEqual((await basis()).target,initial.target);
    await page.keyboard.down('Control');await page.mouse.down({button:'middle'});await page.mouse.move(cx+40,cy+10);await page.mouse.up({button:'middle'});await page.keyboard.up('Control');assert.notEqual((await basis()).zoom,initial.zoom);
    const zoom=(await basis()).zoom;await page.mouse.wheel(0,100);await page.waitForTimeout(100);assert.ok((await basis()).zoom<zoom);
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.mouse.click(cx+130,cy+70);const cursor=(await state()).cursor;assert.notDeepEqual(cursor,[0,0,0]);
    await page.mouse.move(cx,cy);await page.keyboard.press('g');await page.keyboard.press('x');await page.mouse.move(cx+50,cy+25);assert.notEqual((await state()).loc[0],0);await page.mouse.click(cx+50,cy+25,{button:'right'});assert.deepEqual((await state()).loc,[0,0,0]);
    await page.keyboard.press('Tab');assert.equal((await state()).edit,true);await page.keyboard.press('a');assert.equal((await state()).selected.length,0);
    await page.keyboard.press('b');await page.mouse.move(cx-110,cy-110);await page.mouse.down();await page.mouse.move(cx+110,cy+110);await page.mouse.up();assert.equal((await state()).selected.length,8);
    await page.keyboard.press('e');await page.mouse.move(cx+150,cy+70);assert.equal((await state()).vertices,8);await page.keyboard.press('Escape');assert.equal((await state()).vertices,8);
    await page.keyboard.press('Tab');assert.equal((await state()).edit,false);
    await page.keyboard.press('Space');await page.getByRole('button',{name:'Add >',exact:true}).click();await page.getByRole('button',{name:'Mesh >',exact:true}).click();await page.getByRole('button',{name:'UV Sphere',exact:true}).click();assert.equal((await state()).objects,4);assert.deepEqual((await state()).loc,cursor);
    await page.getByRole('button',{name:'Material',exact:true}).click();await page.getByLabel('Diffuse color').fill('#ed9257');await page.getByLabel('Diffuse color').dispatchEvent('change');
    await page.getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('spinbutton',{name:'LocX',exact:true}).fill('3');await page.getByRole('spinbutton',{name:'LocX',exact:true}).press('Tab');assert.equal((await state()).loc[0],3);
    await page.mouse.click(cx+220,cy+100);await page.keyboard.press('z');
    await page.screenshot({path:'tests/blender-ui.png'});
    await page.keyboard.press('F12');await page.locator('.blender-render span').filter({hasText:'DONE'}).waitFor();
    const pixels=await page.locator('.blender-render canvas').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,320,240).data;let n=0;for(let i=0;i<data.length;i+=4)if(data[i]!==37)n++;return n;});assert.ok(pixels>500);
    await page.screenshot({path:'tests/blender-render.png'});
    await page.locator('#app_blender_render .btn-close').click();
    await page.locator('#app_blender .btn-min').click();await page.locator('.desktop-icon[data-id="blender"]').dblclick();await page.locator('#app_blender').waitFor({state:'visible'});
    await page.locator('#app_blender .btn-close').click();await page.locator('.desktop-icon[data-id="blender"]').dblclick();assert.equal((await state()).objects,4);
    await page.locator('#app_blender .btn-close').click();
    assert.deepEqual(errors,[]);console.log('PASS browser: launch, cursor, G/X/cancel, Tab, border, extrusion rollback, primitive menu, material, numeric fields, solid, F12, restore, reopen, no runtime errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
