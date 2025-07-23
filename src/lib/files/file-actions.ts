import { NodeType } from "../../../database.types";
import { createClient } from "../client";

const supabase = createClient();

const deleteNode = async (node: NodeType) => {
  const { data, error } = await supabase
    .from("nodes")
    .delete()
    .like("path", `${node.path}%`);

  //incase i ever need to delete using user id and path they also serve as a combined primary key
  // const { data, error } = await supabase
  //   .from("nodes")
  //   .delete()
  //   .eq("path", node.path)
  //   .eq("user_id", node.user_id);
};

const updateNode = async (node: NodeType) => {
  const { id, ...fieldsToUpdate } = node;
  const { data, error } = await supabase
    .from("nodes")
    .update(fieldsToUpdate)
    .eq("id", node.id);
};

export { deleteNode, updateNode };
