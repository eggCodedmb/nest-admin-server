/**
 * 构造树型结构数据
 * @param data 扁平列表
 * @param id 节点ID键名
 * @param parentId 父节点ID键名
 * @param children 子节点键名
 */
export function buildTree<T extends Record<string, any>>(
  data: T[],
  id = 'id',
  parentId = 'parentId',
  children = 'children',
): T[] {
  const map = new Map<number | string, T>();
  const treeList: T[] = [];

  data.forEach((item) => {
    map.set(item[id], { ...item, [children]: [] });
  });

  data.forEach((item) => {
    const node = map.get(item[id]);
    const pId = item[parentId];
    if (pId !== 0 && pId !== null && pId !== undefined && map.has(pId)) {
      map.get(pId)![children].push(node);
    } else {
      treeList.push(node!);
    }
  });

  return treeList;
}
